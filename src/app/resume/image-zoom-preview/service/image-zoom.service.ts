import {
  Overlay,
  ViewportRuler,
  type ConnectedPosition,
  type OverlayRef,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { DestroyRef, Injector, inject, Service } from '@angular/core';
import { Subscription } from 'rxjs';

import { ImageZoomPreview } from '../image-zoom-preview.ts';
import type { ImageZoomPreviewData } from '../../../helper/interface/image-zoom-preview-data/image-zoom-preview-data.interface.ts';
import { IMAGE_ZOOM_PREVIEW_DATA } from '../../../helper/injection-token/image-zoom-preview-data.variable.ts';
import type { ImageZoomActivation } from '../../../helper/type/image-zoom-activation.type.ts';
import type { ImageZoomRequest } from '../../../helper/interface/image-zoom-request/image-zoom-request.interface.ts';
import { VIEWPORT_MARGIN } from '../../../helper/injection-token/viewpoint-margin.variable.ts';
import { IMAGE_MAX_VIEWPORT_RATIO } from '../../../helper/injection-token/image-max-viewpoint-radio.variable.ts';
import { IMAGE_ZOOM_POSITIONS } from '../../../helper/injection-token/image-zoom-positions.variable.ts';
import { PANEL_CHROME_PX } from '../../../helper/injection-token/panel-chrome-px.variable.ts';

/**
 * Owns the application's single connected logo-preview overlay.
 *
 * @remarks Opening another origin replaces the current overlay. Reopening the same attached
 * origin only repositions it and preserves its original activation owner. Hover panes ignore
 * pointer input, while touch panes support inside interaction; outside interaction and Escape
 * dismiss either mode. Optional origin and activation guards prevent unrelated directives from
 * closing a preview they do not own.
 */
@Service()
export class ImageZoomService {
  private readonly overlay = inject(Overlay);
  private readonly viewportRuler = inject(ViewportRuler);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewportMargin = inject(VIEWPORT_MARGIN);
  private readonly imageMaxViewportRatio = inject(IMAGE_MAX_VIEWPORT_RATIO);
  private readonly imageZoomPositions = inject(IMAGE_ZOOM_POSITIONS);
  private readonly panelChromePx = inject(PANEL_CHROME_PX);
  private overlayRef: OverlayRef | null = null;
  private currentRequest: ImageZoomRequest | null = null;
  private dismissalSubscriptions: Subscription | null = null;
  private paneResizeObserver: ResizeObserver | null = null;

  /** Ensures an attached overlay and all tracking resources are released with the service. */
  constructor() {
    this.destroyRef.onDestroy(() => this.close());
  }

  /**
   * Opens a viewport-bounded preview, replacing any other origin's overlay.
   *
   * @param request - Origin, preview metadata, and activation ownership for the overlay.
   * @remarks A currently attached overlay for the same origin is repositioned without replacing
   * its component data or activation owner. Attachment failures tear down partial state before
   * being rethrown.
   */
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
      .withPositions([...this.imageZoomPositions])
      .withViewportMargin(this.viewportMargin)
      .withFlexibleDimensions(false)
      .withPush(true);
    const overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition({ scrollThrottle: 0 }),
      panelClass:
        request.activation === 'hover'
          ? [
              'image-zoom-preview-overlay-pane',
              'image-zoom-preview-overlay-pane--pointer-transparent',
            ]
          : ['image-zoom-preview-overlay-pane'],
      maxWidth: `calc(100vw - ${this.viewportMargin * 2}px)`,
      maxHeight: `calc(100vh - ${this.viewportMargin * 2}px)`,
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
        ...(request.background === undefined ? {} : { background: request.background }),
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

  /** Opens a request unless its origin already owns the attached preview, in which case it closes. */
  toggle(request: ImageZoomRequest): void {
    if (this.isOpenFor(request.origin)) {
      this.close(request.origin);
    } else {
      this.open(request);
    }
  }

  /**
   * Disposes the active preview when all supplied ownership guards match.
   *
   * @param origin - Optional image owner; omitting it permits closing any active origin.
   * @param activation - Optional activation owner; omitting it permits either interaction mode.
   */
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

  /**
   * Checks attached preview ownership.
   *
   * @param origin - Image expected to own the active overlay.
   * @param activation - Optional interaction owner that must also match.
   * @returns Whether an attached overlay satisfies the requested ownership.
   */
  isOpenFor(origin: HTMLImageElement, activation?: ImageZoomActivation): boolean {
    return (
      this.overlayRef?.hasAttached() === true &&
      this.currentRequest?.origin === origin &&
      (!activation || this.currentRequest.activation === activation)
    );
  }

  /** Clears service state when CDK detaches the currently owned overlay externally. */
  private handleExternalDisposal(overlayRef: OverlayRef): void {
    if (this.overlayRef !== overlayRef) {
      return;
    }

    const subscriptions = this.dismissalSubscriptions;
    this.teardownOverlayTracking();
    subscriptions?.unsubscribe();
  }

  /** Wraps every CDK position pass with current size limits and a corrective viewport clamp. */
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

  /** Publishes pane and image limits derived from the current viewport and panel chrome. */
  private applyViewportSizeLimits(overlayRef: OverlayRef): void {
    const viewport = this.viewportRuler.getViewportSize();
    const maxWidth = Math.max(viewport.width - this.viewportMargin * 2, 0);
    const maxHeight = Math.max(viewport.height - this.viewportMargin * 2, 0);
    const imageMaxWidth = Math.min(
      viewport.width * this.imageMaxViewportRatio,
      Math.max(maxWidth - this.panelChromePx, 0),
    );
    const imageMaxHeight = Math.min(
      viewport.height * this.imageMaxViewportRatio,
      Math.max(maxHeight - this.panelChromePx, 0),
    );
    const pane = overlayRef.overlayElement;

    pane.style.maxWidth = `${maxWidth}px`;
    pane.style.maxHeight = `${maxHeight}px`;
    pane.style.setProperty('--image-zoom-preview-viewport-max-width', `${maxWidth}px`);
    pane.style.setProperty('--image-zoom-preview-viewport-max-height', `${maxHeight}px`);
    pane.style.setProperty('--image-zoom-preview-image-max-width', `${imageMaxWidth}px`);
    pane.style.setProperty('--image-zoom-preview-image-max-height', `${imageMaxHeight}px`);
  }

  /**
   * Corrects any residual viewport overflow after CDK positioning, including wide panes that CDK
   * cannot push because scrollbar-aware client dimensions differ from viewport sizing.
   */
  private clampOverlayToViewport(overlayRef: OverlayRef): void {
    const pane = overlayRef.overlayElement;
    const rect = pane.getBoundingClientRect();
    const viewport = this.viewportRuler.getViewportSize();
    const minLeft = this.viewportMargin;
    const minTop = this.viewportMargin;
    const maxRight = viewport.width - this.viewportMargin;
    const maxBottom = viewport.height - this.viewportMargin;

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

  /** Repositions after initial rendering and whenever decoded preview content changes pane size. */
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

  /** Clears active ownership and pane-size observation without disposing the pane itself. */
  private teardownOverlayTracking(): void {
    this.disconnectPaneResizeObserver();
    this.overlayRef = null;
    this.currentRequest = null;
    this.dismissalSubscriptions = null;
  }
}
