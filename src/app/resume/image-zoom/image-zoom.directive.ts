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

interface ImageSize {
  readonly width: number;
  readonly height: number;
}

const DOWNSCALE_TOLERANCE = 0.01;

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
  readonly appImageZoom = input.required<BrandLogo>();
  readonly imageZoomLabel = input.required<string>();
  readonly imageZoomTouch = input(true);

  private readonly image = inject<ElementRef<HTMLImageElement>>(ElementRef).nativeElement;
  private readonly imageZoomService = inject(ImageZoomService);
  private resizeObserver: ResizeObserver | null = null;
  private imageFailed = false;
  private eligible = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.resizeObserver?.disconnect();
      this.imageZoomService.close(this.image);
    });
  }

  ngAfterViewInit(): void {
    const ResizeObserverConstructor = globalThis.ResizeObserver;

    if (typeof ResizeObserverConstructor === 'function') {
      this.resizeObserver = new ResizeObserverConstructor(() => this.updateEligibility());
      this.resizeObserver.observe(this.image);
    }

    this.updateEligibility();
  }

  protected handlePointerEnter(event: PointerEvent): void {
    if (!this.isHoverPointer(event) || !this.updateEligibility()) {
      return;
    }

    this.imageZoomService.open(this.request('hover'));
  }

  protected handlePointerLeave(event: PointerEvent): void {
    if (this.isHoverPointer(event)) {
      this.imageZoomService.close(this.image, 'hover');
    }
  }

  protected handleClick(event: PointerEvent): void {
    if (event.pointerType !== 'touch' || !this.imageZoomTouch() || !this.updateEligibility()) {
      return;
    }

    this.imageZoomService.toggle(this.request('touch'));
  }

  protected handleLoad(): void {
    this.imageFailed = false;
    this.updateEligibility();
  }

  protected handleError(): void {
    this.imageFailed = true;
    this.updateEligibility();
  }

  private updateEligibility(): boolean {
    this.eligible = !this.imageFailed && this.isDownscaled();

    if (!this.eligible && this.imageZoomService.isOpenFor(this.image)) {
      this.imageZoomService.close(this.image);
    }

    return this.eligible;
  }

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

  private isHoverPointer(event: PointerEvent): boolean {
    return event.pointerType === 'mouse' || event.pointerType === 'pen';
  }

  private request(activation: ImageZoomActivation): ImageZoomRequest {
    return {
      origin: this.image,
      logo: this.appImageZoom(),
      label: this.imageZoomLabel(),
      activation,
    };
  }
}
