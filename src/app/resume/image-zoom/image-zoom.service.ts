import {
  Overlay,
  ViewportRuler,
  type ConnectedPosition,
  type OverlayRef,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { DestroyRef, Injector, inject, Service } from '@angular/core';
import { Subscription } from 'rxjs';

import {
  IMAGE_ZOOM_PREVIEW_DATA,
  ImageZoomPreview,
  type ImageZoomPreviewData,
} from './image-zoom-preview';
import type { BrandLogo } from '../../helper/interface/brand-logo/brand-logo.interface.ts';

/** Interaction mode that owns an open preview and controls its pointer behavior. */
export type ImageZoomActivation = 'hover' | 'touch';

/** Complete request for opening a logo preview beside its rendered image. */
export interface ImageZoomRequest {
  /** Rendered image that owns and anchors the overlay. */
  readonly origin: HTMLImageElement;

  /** Intrinsic asset and surface metadata rendered by the preview. */
  readonly logo: BrandLogo;

  /** Descriptive alternative text copied to the enlarged image. */
  readonly label: string;

  /** Exact preview surface override; omission retains the logo tone's standard card color. */
  readonly background?: string;

  /** Interaction mode used for ownership checks and pane pointer behavior. */
  readonly activation: ImageZoomActivation;
}

/** Minimum space retained between the overlay pane and each viewport edge. */
const VIEWPORT_MARGIN = 16;

/** Maximum share of either viewport dimension occupied by the preview image itself. */
const IMAGE_MAX_VIEWPORT_RATIO = 0.2;

/** Preferred visual separation between an origin and its connected preview. */
const ORIGIN_GAP = 12;

/** Panel padding (0.75rem * 2) + border (1px * 2), matching `image-zoom-preview.scss`. */
const PANEL_CHROME_PX = 26;

/** Connected placement fallbacks tried in right, left, below, then above order. */
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
    const maxWidth = Math.max(viewport.width - VIEWPORT_MARGIN * 2, 0);
    const maxHeight = Math.max(viewport.height - VIEWPORT_MARGIN * 2, 0);
    const imageMaxWidth = Math.min(
      viewport.width * IMAGE_MAX_VIEWPORT_RATIO,
      Math.max(maxWidth - PANEL_CHROME_PX, 0),
    );
    const imageMaxHeight = Math.min(
      viewport.height * IMAGE_MAX_VIEWPORT_RATIO,
      Math.max(maxHeight - PANEL_CHROME_PX, 0),
    );
    const pane = overlayRef.overlayElement;

    pane.style.maxWidth = `${maxWidth}px`;
    pane.style.maxHeight = `${maxHeight}px`;
    pane.style.setProperty('--image-zoom-viewport-max-width', `${maxWidth}px`);
    pane.style.setProperty('--image-zoom-viewport-max-height', `${maxHeight}px`);
    pane.style.setProperty('--image-zoom-image-max-width', `${imageMaxWidth}px`);
    pane.style.setProperty('--image-zoom-image-max-height', `${imageMaxHeight}px`);
  }

  /**
   * Corrects any residual viewport overflow after CDK positioning, including wide panes that CDK
   * cannot push because scrollbar-aware client dimensions differ from viewport sizing.
   */
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
