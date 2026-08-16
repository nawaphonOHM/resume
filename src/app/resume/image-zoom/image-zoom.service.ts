import {
  Overlay,
  ViewportRuler,
  type ConnectedPosition,
  type OverlayRef,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { DestroyRef, Injectable, Injector, inject } from '@angular/core';
import { Subscription } from 'rxjs';

import type { BrandLogo } from '../../model/resume/resume.model';
import {
  IMAGE_ZOOM_PREVIEW_DATA,
  ImageZoomPreview,
  type ImageZoomPreviewData,
} from './image-zoom-preview';

export type ImageZoomActivation = 'hover' | 'touch';

export interface ImageZoomRequest {
  readonly origin: HTMLImageElement;
  readonly logo: BrandLogo;
  readonly label: string;
  readonly activation: ImageZoomActivation;
}

const VIEWPORT_MARGIN = 16;
const ORIGIN_GAP = 12;
/** Panel padding (0.75rem * 2) + border (1px * 2), matching `image-zoom-preview.scss`. */
const PANEL_CHROME_PX = 26;
const IMAGE_ZOOM_POSITIONS: readonly ConnectedPosition[] = [
  {
    originX: 'end',
    originY: 'center',
    overlayX: 'start',
    overlayY: 'center',
    offsetX: ORIGIN_GAP,
  },
  {
    originX: 'start',
    originY: 'center',
    overlayX: 'end',
    overlayY: 'center',
    offsetX: -ORIGIN_GAP,
  },
  {
    originX: 'center',
    originY: 'bottom',
    overlayX: 'center',
    overlayY: 'top',
    offsetY: ORIGIN_GAP,
  },
  {
    originX: 'center',
    originY: 'top',
    overlayX: 'center',
    overlayY: 'bottom',
    offsetY: -ORIGIN_GAP,
  },
];

@Injectable({ providedIn: 'root' })
export class ImageZoomService {
  private readonly overlay = inject(Overlay);
  private readonly viewportRuler = inject(ViewportRuler);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private overlayRef: OverlayRef | null = null;
  private currentRequest: ImageZoomRequest | null = null;
  private dismissalSubscriptions: Subscription | null = null;
  private paneResizeObserver: ResizeObserver | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.close());
  }

  open(request: ImageZoomRequest): void {
    if (this.currentRequest?.origin === request.origin && this.overlayRef?.hasAttached()) {
      this.overlayRef.updatePosition();
      return;
    }

    this.close();

    // Exact positioning + push is the baseline, but CDK skips horizontal push when the
    // overlay is wider than its clientWidth-based viewport (common with 100vw sizing and
    // scrollbars). We clamp after every position pass so wide previews stay in-bounds.
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(request.origin)
      .withPositions([...IMAGE_ZOOM_POSITIONS])
      .withViewportMargin(VIEWPORT_MARGIN)
      .withFlexibleDimensions(false)
      .withPush(true);
    const overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition({ scrollThrottle: 0 }),
      panelClass:
        request.activation === 'hover'
          ? ['image-zoom-overlay-pane', 'image-zoom-overlay-pane--pointer-transparent']
          : ['image-zoom-overlay-pane'],
      maxWidth: `calc(100vw - ${VIEWPORT_MARGIN * 2}px)`,
      maxHeight: `calc(100vh - ${VIEWPORT_MARGIN * 2}px)`,
      disposeOnNavigation: true,
    });
    const subscriptions = new Subscription();

    this.overlayRef = overlayRef;
    this.currentRequest = request;
    this.dismissalSubscriptions = subscriptions;
    this.installViewportBoundedPositioning(overlayRef);

    subscriptions.add(
      overlayRef.outsidePointerEvents().subscribe((event) => {
        if (event.target !== request.origin) {
          this.close(request.origin);
        }
      }),
    );
    subscriptions.add(
      overlayRef.keydownEvents().subscribe((event) => {
        if (event.key === 'Escape') {
          this.close(request.origin);
        }
      }),
    );
    subscriptions.add(
      overlayRef.detachments().subscribe(() => this.handleExternalDisposal(overlayRef)),
    );

    try {
      const previewData: ImageZoomPreviewData = {
        logo: request.logo,
        label: request.label,
      };
      const previewInjector = Injector.create({
        parent: this.injector,
        providers: [{ provide: IMAGE_ZOOM_PREVIEW_DATA, useValue: previewData }],
      });
      const componentRef = overlayRef.attach(
        new ComponentPortal(ImageZoomPreview, null, previewInjector),
      );
      componentRef.changeDetectorRef.detectChanges();
      // Attach positions before the preview's intrinsic box settles; remeasure afterwards.
      this.watchOverlayPaneSize(overlayRef);
    } catch (error) {
      this.close(request.origin);
      throw error;
    }
  }

  toggle(request: ImageZoomRequest): void {
    if (this.isOpenFor(request.origin)) {
      this.close(request.origin);
    } else {
      this.open(request);
    }
  }

  close(origin?: HTMLImageElement, activation?: ImageZoomActivation): void {
    if (
      !this.overlayRef ||
      !this.currentRequest ||
      (origin && this.currentRequest.origin !== origin) ||
      (activation && this.currentRequest.activation !== activation)
    ) {
      return;
    }

    const overlayRef = this.overlayRef;
    const subscriptions = this.dismissalSubscriptions;

    this.teardownOverlayTracking();
    subscriptions?.unsubscribe();
    overlayRef.dispose();
  }

  isOpenFor(origin: HTMLImageElement, activation?: ImageZoomActivation): boolean {
    return (
      this.overlayRef?.hasAttached() === true &&
      this.currentRequest?.origin === origin &&
      (!activation || this.currentRequest.activation === activation)
    );
  }

  private handleExternalDisposal(overlayRef: OverlayRef): void {
    if (this.overlayRef !== overlayRef) {
      return;
    }

    const subscriptions = this.dismissalSubscriptions;
    this.teardownOverlayTracking();
    subscriptions?.unsubscribe();
  }

  private installViewportBoundedPositioning(overlayRef: OverlayRef): void {
    const updatePosition = overlayRef.updatePosition.bind(overlayRef);

    // Scroll/reposition and explicit updatePosition calls all land here so clamping is sticky.
    overlayRef.updatePosition = () => {
      if (this.overlayRef !== overlayRef || !overlayRef.hasAttached()) {
        return;
      }

      this.applyViewportSizeLimits(overlayRef);
      updatePosition();
      this.clampOverlayToViewport(overlayRef);
    };
  }

  private applyViewportSizeLimits(overlayRef: OverlayRef): void {
    const viewport = this.viewportRuler.getViewportSize();
    const maxWidth = Math.max(viewport.width - VIEWPORT_MARGIN * 2, 0);
    const maxHeight = Math.max(viewport.height - VIEWPORT_MARGIN * 2, 0);
    const imageMaxWidth = Math.max(maxWidth - PANEL_CHROME_PX, 0);
    const imageMaxHeight = Math.max(maxHeight - PANEL_CHROME_PX, 0);
    const pane = overlayRef.overlayElement;

    pane.style.maxWidth = `${maxWidth}px`;
    pane.style.maxHeight = `${maxHeight}px`;
    pane.style.setProperty('--image-zoom-viewport-max-width', `${maxWidth}px`);
    pane.style.setProperty('--image-zoom-viewport-max-height', `${maxHeight}px`);
    pane.style.setProperty('--image-zoom-image-max-width', `${imageMaxWidth}px`);
    pane.style.setProperty('--image-zoom-image-max-height', `${imageMaxHeight}px`);
  }

  private clampOverlayToViewport(overlayRef: OverlayRef): void {
    const pane = overlayRef.overlayElement;
    const rect = pane.getBoundingClientRect();
    const viewport = this.viewportRuler.getViewportSize();
    const minLeft = VIEWPORT_MARGIN;
    const minTop = VIEWPORT_MARGIN;
    const maxRight = viewport.width - VIEWPORT_MARGIN;
    const maxBottom = viewport.height - VIEWPORT_MARGIN;

    let nextLeft = rect.left;
    let nextTop = rect.top;

    if (nextLeft + rect.width > maxRight) {
      nextLeft = maxRight - rect.width;
    }
    if (nextLeft < minLeft) {
      nextLeft = minLeft;
    }

    if (nextTop + rect.height > maxBottom) {
      nextTop = maxBottom - rect.height;
    }
    if (nextTop < minTop) {
      nextTop = minTop;
    }

    const deltaX = nextLeft - rect.left;
    const deltaY = nextTop - rect.top;
    if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) {
      return;
    }

    // Re-base from the visual box. CDK may serialize top/left as `inset` and keep
    // origin-gap transforms, which desync style.left from getBoundingClientRect().
    pane.style.inset = 'auto';
    pane.style.transform = 'none';
    pane.style.left = `${nextLeft}px`;
    pane.style.top = `${nextTop}px`;
    pane.style.right = 'auto';
    pane.style.bottom = 'auto';
  }

  private watchOverlayPaneSize(overlayRef: OverlayRef): void {
    this.disconnectPaneResizeObserver();

    const syncPosition = (): void => {
      if (this.overlayRef === overlayRef && overlayRef.hasAttached()) {
        overlayRef.updatePosition();
      }
    };

    // First layout pass after detectChanges — intrinsic metadata sizing is available now.
    syncPosition();

    const ResizeObserverConstructor = globalThis.ResizeObserver;
    if (typeof ResizeObserverConstructor !== 'function') {
      return;
    }

    // Keep bounds correct if the preview box changes after image decode/layout.
    this.paneResizeObserver = new ResizeObserverConstructor(() => syncPosition());
    this.paneResizeObserver.observe(overlayRef.overlayElement);
  }

  private disconnectPaneResizeObserver(): void {
    this.paneResizeObserver?.disconnect();
    this.paneResizeObserver = null;
  }

  private teardownOverlayTracking(): void {
    this.disconnectPaneResizeObserver();
    this.overlayRef = null;
    this.currentRequest = null;
    this.dismissalSubscriptions = null;
  }
}
