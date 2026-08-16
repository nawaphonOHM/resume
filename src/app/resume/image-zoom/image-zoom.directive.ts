import {
  DestroyRef,
  Directive,
  ElementRef,
  type AfterViewInit,
  inject,
  input,
} from '@angular/core';

import type { BrandLogo } from '../../model/resume/resume.model';
import {
  ImageZoomService,
  type ImageZoomActivation,
  type ImageZoomRequest,
} from './image-zoom.service';

/** Pixel dimensions used to compare an image's intrinsic and rendered content boxes. */
interface ImageSize {
  readonly width: number;
  readonly height: number;
}

/** Scale difference required to treat an image as downscaled rather than measurement noise. */
const DOWNSCALE_TOLERANCE = 0.01;

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
export class ImageZoomDirective implements AfterViewInit {
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
  private resizeObserver: ResizeObserver | null = null;
  private imageFailed = false;
  private eligible = false;

  /** Registers lifecycle cleanup for resize observation and origin-owned overlays. */
  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.resizeObserver?.disconnect();
      this.imageZoomService.close(this.image);
    });
  }

  /** Starts optional resize tracking and computes initial eligibility after view creation. */
  ngAfterViewInit(): void {
    const ResizeObserverConstructor = globalThis.ResizeObserver;

    if (typeof ResizeObserverConstructor === 'function') {
      this.resizeObserver = new ResizeObserverConstructor(() => this.updateEligibility());
      this.resizeObserver.observe(this.image);
    }

    this.updateEligibility();
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
    this.imageFailed = false;
    this.updateEligibility();
  }

  /** Marks the image ineligible and closes any preview it owns after a load failure. */
  protected handleError(): void {
    this.imageFailed = true;
    this.updateEligibility();
  }

  /**
   * Recomputes whether zoom adds detail and closes this origin's preview when it no longer does.
   *
   * @returns The current eligibility used by event handlers.
   */
  private updateEligibility(): boolean {
    this.eligible = !this.imageFailed && this.isDownscaled();

    if (!this.eligible && this.imageZoomService.isOpenFor(this.image)) {
      this.imageZoomService.close(this.image);
    }

    return this.eligible;
  }

  /**
   * Compares the contained scale against intrinsic dimensions; the tolerance prevents tiny layout
   * rounding differences from creating an interaction that provides no useful enlargement.
   */
  private isDownscaled(): boolean {
    const intrinsicSize = this.intrinsicSize();
    const contentBoxSize = this.contentBoxSize();

    if (!intrinsicSize || !contentBoxSize) {
      return false;
    }

    const containedScale = Math.min(
      contentBoxSize.width / intrinsicSize.width,
      contentBoxSize.height / intrinsicSize.height,
    );

    return Number.isFinite(containedScale) && containedScale < 1 - DOWNSCALE_TOLERANCE;
  }

  /** @returns Valid natural dimensions, falling back to required logo metadata before loading. */
  private intrinsicSize(): ImageSize | null {
    const naturalSize = {
      width: this.image.naturalWidth,
      height: this.image.naturalHeight,
    };

    if (this.isValidSize(naturalSize)) {
      return naturalSize;
    }

    const logo = this.appImageZoom();
    const metadataSize = { width: logo.width, height: logo.height };
    return this.isValidSize(metadataSize) ? metadataSize : null;
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
    const background = this.imageZoomBackground();

    return {
      origin: this.image,
      logo: this.appImageZoom(),
      label: this.imageZoomLabel(),
      activation,
      ...(background === undefined ? {} : { background }),
    };
  }
}
