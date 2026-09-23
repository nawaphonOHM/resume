import {
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

import { ImageZoomService } from '../../../resume/image-zoom-preview/service/image-zoom.service.ts';
import type { ImageZoomActivation } from '../../type/image-zoom-activation.type.ts';
import type { ImageZoomRequest } from '../../interface/image-zoom-request/image-zoom-request.interface.ts';
import type { BrandLogo } from '../../interface/brand-logo/brand-logo.interface.ts';
import type { ImageSize } from '../../interface/image-size/imgae-size.interface.ts';
import type { ImageState } from '../../interface/image-state/image-state.interface.ts';
import type { ImageZoomPayload } from '../../type/image-zoom-payload.type.ts';
import { DOWNSCALE_TOLERANCE } from '../../injection-token/downscale-tolerance.variable.ts';
import { INITIAL_IMAGE_STATE } from '../../injection-token/initial-image-state.variable.ts';

/**
 * Adds an intrinsic-size preview interaction to a rendered logo image when it is downscaled.
 *
 * @remarks
 * ### Downscale Detection & Geometry
 * Brand logo images in responsive layouts often render at a fraction of their natural SVG / PNG
 * resolution. This directive evaluates the ratio between rendered content-box dimensions and intrinsic
 * dimensions:
 * ```
 * scale_x = contentBox.width / intrinsic.width
 * scale_y = contentBox.height / intrinsic.height
 * containedScale = min(scale_x, scale_y)
 * isDownscaled = containedScale < (1 - downscaleTolerance)
 * ```
 *
 * ### Content-Box Calculation
 * To accurately compare dimensions against intrinsic pixel bounds, the content box is computed by
 * subtracting CSS borders and paddings from `getBoundingClientRect()`:
 * ```
 * W_content = W_bounds - (borderLeft + borderRight + paddingLeft + paddingRight)
 * H_content = H_bounds - (borderTop + borderBottom + paddingTop + paddingBottom)
 * ```
 *
 * ### Interaction Model & Ownership
 * - **Pointer (Mouse / Pen)**: Hover entry opens a hover-owned overlay; pointer exit closes hover ownership.
 * - **Touch**: Completed click toggles touch-owned overlay persistence.
 * - **Dynamic Invalidation**: Load errors, container resizing (`ResizeObserver`), or layout shifts that bring
 *   the image back to full scale automatically close any active preview.
 */
@Directive({
  selector: 'img[appImageZoom]',
  host: {
    '(click)': 'handleClick($event)',
    '(error)': 'handleError()',
    '(load)': 'handleLoad()',
    '(pointerenter)': 'handlePointerEnter($event)',
    '(pointerleave)': 'handlePointerLeave($event)',
  },
})
export class ImageZoomDirective {
  /** Required logo metadata used for preview rendering and intrinsic-size fallback. */
  readonly appImageZoom = input.required<BrandLogo>();

  /** Required descriptive alternative text copied to the visual preview image. */
  readonly imageZoomLabel = input.required<string>();

  /** Optional exact preview surface, overriding the logo tone's standard card color. */
  readonly imageZoomBackground = input<string>();

  /** Whether completed touch clicks may toggle the preview; defaults to enabled. */
  readonly imageZoomTouch = input(true);

  private readonly image = inject<ElementRef<HTMLImageElement>>(ElementRef).nativeElement;
  private readonly imageZoomService = inject(ImageZoomService);
  private readonly downscaledTolerance = inject(DOWNSCALE_TOLERANCE);
  private readonly imageState = signal<ImageState>(inject(INITIAL_IMAGE_STATE));
  private readonly eligible = computed(() =>
    this.isEligible(this.imageState(), this.appImageZoom()),
  );
  private readonly previewPayload = computed<ImageZoomPayload>(() => {
    const background = this.imageZoomBackground();

    return {
      logo: this.appImageZoom(),
      label: this.imageZoomLabel(),
      ...(background === undefined ? {} : { background }),
    };
  });
  private resizeObserver: ResizeObserver | null = null;

  /** Defers browser measurement and resize observation until the host image has rendered. */
  constructor() {
    afterNextRender({
      read: () => {
        const ResizeObserverConstructor = globalThis.ResizeObserver;

        if (typeof ResizeObserverConstructor === 'function') {
          this.resizeObserver = new ResizeObserverConstructor(() => this.updateEligibility());
          this.resizeObserver.observe(this.image);
        }

        this.updateEligibility();
      },
    });

    effect((onCleanup) => {
      this.previewPayload();
      onCleanup(() => {
        this.imageZoomService.close(this.image);
      });
    });

    inject(DestroyRef).onDestroy(() => {
      this.resizeObserver?.disconnect();
    });
  }

  /** Opens hover ownership only for mouse or pen entry on an eligible image. */
  protected handlePointerEnter(event: PointerEvent): void {
    if (!this.isHoverPointer(event) || !this.updateEligibility()) {
      return;
    }

    this.imageZoomService.open(this.request('hover'));
  }

  /** Releases hover ownership without closing a touch-owned preview for the same image. */
  protected handlePointerLeave(event: PointerEvent): void {
    if (this.isHoverPointer(event)) {
      this.imageZoomService.close(this.image, 'hover');
    }
  }

  /** Toggles an eligible preview only for completed touch clicks when touch support is enabled. */
  protected handleClick(event: PointerEvent): void {
    if (event.pointerType !== 'touch' || !this.imageZoomTouch() || !this.updateEligibility()) {
      return;
    }

    this.imageZoomService.toggle(this.request('touch'));
  }

  /** Clears failure state and reevaluates the image after a successful load. */
  protected handleLoad(): void {
    this.updateEligibility(false);
  }

  /** Marks the image ineligible and closes any preview it owns after a load failure. */
  protected handleError(): void {
    this.updateEligibility(true);
  }

  /**
   * Recomputes whether zoom adds detail and closes this origin's preview when it no longer does.
   *
   * @param failed - Explicit load-failure flag override; defaults to current state.
   * @returns The current eligibility used by event handlers.
   *
   * @remarks
   * Re-evaluates intrinsic dimensions against rendered content-box size. If layout changes or
   * error conditions make the image ineligible, any open overlay owned by this directive is
   * immediately closed to prevent orphaned or non-enlarging previews.
   */
  private updateEligibility(failed = this.imageState().failed): boolean {
    this.imageState.set(
      failed
        ? { failed: true, naturalSize: null, contentBoxSize: null }
        : {
            failed: false,
            naturalSize: this.intrinsicSize(),
            contentBoxSize: this.contentBoxSize(),
          },
    );
    const eligible = this.eligible();

    if (!eligible && this.imageZoomService.isOpenFor(this.image)) {
      this.imageZoomService.close(this.image);
    }

    return eligible;
  }

  /**
   * Purely derives whether the latest image snapshot can provide a useful enlargement.
   *
   * @param state - Current snapshot of image load state and measured content-box dimensions.
   * @param logo - Brand logo input metadata containing fallback intrinsic dimensions.
   * @returns `true` if the image successfully loaded and its rendered size is below intrinsic bounds.
   *
   * @remarks
   * Evaluates intrinsic dimensions using the loaded image element's `naturalWidth`/`naturalHeight`
   * when available, falling back to the author-provided `BrandLogo` metadata dimensions (`logo.width`, `logo.height`).
   */
  private isEligible(state: ImageState, logo: BrandLogo): boolean {
    const metadataSize = { width: logo.width, height: logo.height };
    const intrinsicSize =
      state.naturalSize ?? (this.isValidSize(metadataSize) ? metadataSize : null);

    return !state.failed && this.isDownscaled(intrinsicSize, state.contentBoxSize);
  }

  /**
   * Evaluates whether rendered dimensions are strictly smaller than intrinsic dimensions.
   *
   * @param intrinsicSize - Natural pixel dimensions of the image asset.
   * @param contentBoxSize - Rendered content-box dimensions after excluding borders and padding.
   * @returns `true` if the image is downscaled beyond the allowable tolerance.
   *
   * @remarks
   * ### Mathematical Formula
   * Compares the contained aspect-ratio scale factor against the downscale threshold:
   * ```
   * scale_x = contentBoxSize.width / intrinsicSize.width
   * scale_y = contentBoxSize.height / intrinsicSize.height
   * containedScale = min(scale_x, scale_y)
   *
   * isDownscaled = Number.isFinite(containedScale) && containedScale < (1.0 - downscaledTolerance)
   * ```
   *
   * ### Downscale Tolerance Rationale
   * Subpixel layout calculation, high-DPI display rounding, and fluid CSS grid tracks can result in
   * minor fractional scaling (e.g., a 64px image rendering at 63.8px). Without `downscaledTolerance`
   * (e.g., 0.05 / 5%), a 99.7% scale would trigger an overlay preview that provides no meaningful
   * visual enlargement.
   */
  private isDownscaled(intrinsicSize: ImageSize | null, contentBoxSize: ImageSize | null): boolean {
    if (!intrinsicSize || !contentBoxSize) {
      return false;
    }

    const containedScale = Math.min(
      contentBoxSize.width / intrinsicSize.width,
      contentBoxSize.height / intrinsicSize.height,
    );

    return Number.isFinite(containedScale) && containedScale < 1 - this.downscaledTolerance;
  }

  /** @returns Valid natural dimensions reported by the browser after loading, when available. */
  private intrinsicSize(): ImageSize | null {
    const naturalSize = {
      width: this.image.naturalWidth,
      height: this.image.naturalHeight,
    };
    return this.isValidSize(naturalSize) ? naturalSize : null;
  }

  /**
   * Measures the rendered content-box dimensions of the image element.
   *
   * @returns Rendered content-box width and height in CSS pixels, or `null` if unmeasurable.
   *
   * @remarks
   * ### Box-Model Arithmetic
   * `getBoundingClientRect()` returns the full border-box dimension. To extract the true content area
   * where image pixels are rasterized, computed borders and paddings are subtracted:
   * ```
   * W_content = W_bounds - (borderLeftWidth + borderRightWidth + paddingLeft + paddingRight)
   * H_content = H_bounds - (borderTopWidth + borderBottomWidth + paddingTop + paddingBottom)
   * ```
   */
  private contentBoxSize(): ImageSize | null {
    const bounds = this.image.getBoundingClientRect();
    let width = bounds.width;
    let height = bounds.height;
    const view = this.image.ownerDocument.defaultView;

    if (view) {
      const styles = view.getComputedStyle(this.image);
      width -=
        this.cssPixels(styles.borderLeftWidth) +
        this.cssPixels(styles.borderRightWidth) +
        this.cssPixels(styles.paddingLeft) +
        this.cssPixels(styles.paddingRight);
      height -=
        this.cssPixels(styles.borderTopWidth) +
        this.cssPixels(styles.borderBottomWidth) +
        this.cssPixels(styles.paddingTop) +
        this.cssPixels(styles.paddingBottom);
    }

    const size = { width, height };
    return this.isValidSize(size) ? size : null;
  }

  private isValidSize(size: ImageSize): boolean {
    return (
      Number.isFinite(size.width) &&
      size.width > 0 &&
      Number.isFinite(size.height) &&
      size.height > 0
    );
  }

  private cssPixels(value: string): number {
    const pixels = Number.parseFloat(value);
    return Number.isFinite(pixels) ? pixels : 0;
  }

  /** @returns Whether a pointer supports hover ownership rather than touch toggling. */
  private isHoverPointer(event: PointerEvent): boolean {
    return event.pointerType === 'mouse' || event.pointerType === 'pen';
  }

  /** Builds a service request that preserves this image as the overlay owner. */
  private request(activation: ImageZoomActivation): ImageZoomRequest {
    return {
      origin: this.image,
      ...this.previewPayload(),
      activation,
    };
  }
}
