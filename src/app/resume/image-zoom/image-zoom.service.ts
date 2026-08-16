import { Overlay, type ConnectedPosition, type OverlayRef } from '@angular/cdk/overlay';
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
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private overlayRef: OverlayRef | null = null;
  private currentRequest: ImageZoomRequest | null = null;
  private dismissalSubscriptions: Subscription | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.close());
  }

  open(request: ImageZoomRequest): void {
    if (this.currentRequest?.origin === request.origin && this.overlayRef?.hasAttached()) {
      this.overlayRef.updatePosition();
      return;
    }

    this.close();

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(request.origin)
      .withPositions([...IMAGE_ZOOM_POSITIONS])
      .withViewportMargin(VIEWPORT_MARGIN)
      .withFlexibleDimensions(true)
      .withGrowAfterOpen(true)
      .withPush(true);
    const overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition({ scrollThrottle: 0 }),
      panelClass: 'image-zoom-overlay-pane',
      maxWidth: `calc(100vw - ${VIEWPORT_MARGIN * 2}px)`,
      maxHeight: `calc(100vh - ${VIEWPORT_MARGIN * 2}px)`,
      disposeOnNavigation: true,
    });
    const subscriptions = new Subscription();

    this.overlayRef = overlayRef;
    this.currentRequest = request;
    this.dismissalSubscriptions = subscriptions;

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

    this.overlayRef = null;
    this.currentRequest = null;
    this.dismissalSubscriptions = null;
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
    this.overlayRef = null;
    this.currentRequest = null;
    this.dismissalSubscriptions = null;
    subscriptions?.unsubscribe();
  }
}
