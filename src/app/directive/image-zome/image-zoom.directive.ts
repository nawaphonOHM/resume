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

import type { BrandLogo } from '../../helper/resume/resume.model.ts';
import {
  ImageZoomService,
  type ImageZoomActivation,
  type ImageZoomRequest,
} from '../../resume/image-zoom/image-zoom.service.ts';

/** Pixel dimensions used to compare an image's intrinsic and rendered content boxes. */
interface ImageSize {
  readonly width: number;
  readonly height: number;
}

/** Atomic snapshot of browser-measured image state used by reactive eligibility derivation. */
interface ImageState {
  readonly failed: boolean;
  readonly naturalSize: ImageSize | null;
  readonly contentBoxSize: ImageSize | null;
}

/** Signal-derived preview data that must invalidate an attached same-origin overlay when changed. */
type ImageZoomPayload = Omit<ImageZoomRequest, 'origin' | 'activation'>;

/** Scale difference required to treat an image as downscaled rather than measurement noise. */
const DOWNSCALE_TOLERANCE = 0.01;

/** Unmeasured state used until the host image reaches its first browser render. */
const INITIAL_IMAGE_STATE: ImageState = {
  failed: false,
  naturalSize: null,
  contentBoxSize: null,
};

/**
 * Adds an intrinsic-size preview interaction to a rendered logo image when it is downscaled.
 *
 * @remarks Mouse and pen entry opens a hover-owned preview, while an enabled touch click toggles
 * touch ownership. Failed, full-size, and upscaled images remain inert. Eligibility is recomputed
 * after loading and resizing, and any preview owned by this image is closed if eligibility is
 * lost or the directive is destroyed.
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
  private readonly imageState = signal<ImageState>(INITIAL_IMAGE_STATE);
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
      onCleanup(() => this.imageZoomService.close(this.image));
    });

    inject(DestroyRef).onDestroy(() => this.resizeObserver?.disconnect());
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
   * @returns The current eligibility used by event handlers.
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

  /** Purely derives whether the latest image snapshot can provide a useful enlargement. */
  private isEligible(state: ImageState, logo: BrandLogo): boolean {
    const metadataSize = { width: logo.width, height: logo.height };
    const intrinsicSize =
      state.naturalSize ?? (this.isValidSize(metadataSize) ? metadataSize : null);

    return !state.failed && this.isDownscaled(intrinsicSize, state.contentBoxSize);
  }

  /**
   * Compares the contained scale against intrinsic dimensions; the tolerance prevents tiny layout
   * rounding differences from creating an interaction that provides no useful enlargement.
   */
  private isDownscaled(intrinsicSize: ImageSize | null, contentBoxSize: ImageSize | null): boolean {
    if (!intrinsicSize || !contentBoxSize) {
      return false;
    }

    const containedScale = Math.min(
      contentBoxSize.width / intrinsicSize.width,
      contentBoxSize.height / intrinsicSize.height,
    );

    return Number.isFinite(containedScale) && containedScale < 1 - DOWNSCALE_TOLERANCE;
  }

  /** @returns Valid natural dimensions reported by the browser after loading, when available. */
  private intrinsicSize(): ImageSize | null {
    const naturalSize = {
      width: this.image.naturalWidth,
      height: this.image.naturalHeight,
    };
    return this.isValidSize(naturalSize) ? naturalSize : null;
  }

  /** @returns The rendered content box after excluding borders and padding, when measurable. */
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
