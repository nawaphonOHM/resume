/**
 * Verifies connected-overlay configuration, viewport correction, ownership, dismissal, and
 * cleanup for image previews rendered through the real CDK overlay container.
 */
import {
  Overlay,
  OverlayContainer,
  ViewportRuler,
  type ConnectedPosition,
  type OverlayRef,
} from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import type { BrandLogo } from '../../helper/resume-profile/resume-profile.interface.ts';
import { ImageZoomService, type ImageZoomRequest } from './image-zoom.service';

/** Runtime CDK strategy state inspected to verify fluent positioning configuration. */
interface PositionStrategyState {
  /** Element used as the connected overlay origin. */
  readonly _origin: Element;

  /** Ordered placement fallbacks retained by the strategy. */
  readonly _preferredPositions: readonly ConnectedPosition[];

  /** Configured minimum distance from viewport edges. */
  readonly _viewportMargin: number;

  /** Whether CDK may resize the overlay to fit available space. */
  readonly _hasFlexibleDimensions: boolean;

  /** Whether an attached overlay may expand after its first layout. */
  readonly _growAfterOpen: boolean;

  /** Whether CDK may push a connected overlay back into the viewport. */
  readonly _canPush: boolean;
}

describe('ImageZoomService', () => {
  /** Light-surface asset used for initial and hover-owned previews. */
  const lightLogo: BrandLogo = {
    src: '/images/light-logo.svg',
    width: 480,
    height: 240,
    surface: 'light',
  };

  /** Dark-surface asset used to verify replacement content and touch-owned previews. */
  const darkLogo: BrandLogo = {
    src: '/images/dark-logo.svg',
    width: 360,
    height: 360,
    surface: 'dark',
  };

  /** Body-mounted origins tracked so each test can remove only the elements it created. */
  const origins: HTMLImageElement[] = [];

  beforeEach(() => TestBed.configureTestingModule({}));

  afterEach(() => {
    for (const origin of origins.splice(0)) {
      origin.remove();
    }

    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('renders content in a viewport-bounded connected overlay with reposition scrolling', () => {
    const origin = createOrigin('first');
    const overlay = TestBed.inject(Overlay);
    const viewportRuler = TestBed.inject(ViewportRuler);
    vi.spyOn(viewportRuler, 'getViewportSize').mockReturnValue({ width: 1200, height: 800 });
    const create = vi.spyOn(overlay, 'create');
    const reposition = vi.spyOn(overlay.scrollStrategies, 'reposition');
    const service = TestBed.inject(ImageZoomService);

    service.open(request(origin, lightLogo, 'Light brand', 'hover'));

    const config = create.mock.calls[0]?.[0];
    const position = config?.positionStrategy as unknown as PositionStrategyState;
    const preview = overlayContainer().querySelector<HTMLElement>('app-image-zoom-preview');
    const image = preview?.querySelector<HTMLImageElement>('img');
    const pane = overlayContainer().querySelector<HTMLElement>('.image-zoom-overlay-pane');

    expect(create).toHaveBeenCalledTimes(1);
    expect(reposition).toHaveBeenCalledWith({ scrollThrottle: 0 });
    expect(config).toMatchObject({
      disposeOnNavigation: true,
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: 'calc(100vh - 32px)',
      panelClass: ['image-zoom-overlay-pane', 'image-zoom-overlay-pane--pointer-transparent'],
    });
    expect(position._origin).toBe(origin);
    expect(position._viewportMargin).toBe(16);
    expect(position._hasFlexibleDimensions).toBe(false);
    expect(position._growAfterOpen).toBe(false);
    expect(position._canPush).toBe(true);
    expect(position._preferredPositions).toHaveLength(4);
    expect(position._preferredPositions).toMatchObject([
      {
        originX: 'end',
        originY: 'center',
        overlayX: 'start',
        overlayY: 'center',
        offsetX: 12,
      },
      {
        originX: 'start',
        originY: 'center',
        overlayX: 'end',
        overlayY: 'center',
        offsetX: -12,
      },
      {
        originX: 'center',
        originY: 'bottom',
        overlayX: 'center',
        overlayY: 'top',
        offsetY: 12,
      },
      {
        originX: 'center',
        originY: 'top',
        overlayX: 'center',
        overlayY: 'bottom',
        offsetY: -12,
      },
    ]);
    expect(pane?.style.getPropertyValue('--image-zoom-viewport-max-width')).toBe('1168px');
    expect(pane?.style.getPropertyValue('--image-zoom-viewport-max-height')).toBe('768px');
    expect(pane?.style.getPropertyValue('--image-zoom-image-max-width')).toBe('240px');
    expect(pane?.style.getPropertyValue('--image-zoom-image-max-height')).toBe('160px');
    expect(preview?.getAttribute('aria-hidden')).toBe('true');
    expect(image?.getAttribute('src')).toBe(lightLogo.src);
    expect(image?.getAttribute('alt')).toBe('Light brand');
    expect(service.isOpenFor(origin, 'hover')).toBe(true);
  });

  it('forwards an optional exact background to the preview while retaining logo metadata', () => {
    const origin = createOrigin('background-override');
    const service = TestBed.inject(ImageZoomService);

    service.open(request(origin, lightLogo, 'Enhanced brand', 'hover', '#0d1b2d'));

    const panel = overlayContainer().querySelector<HTMLElement>('.image-zoom-preview');
    const image = panel?.querySelector<HTMLImageElement>('img');

    expect(panel?.classList.contains('image-zoom-preview--light')).toBe(true);
    expect(panel?.style.backgroundColor).toBe('rgb(13, 27, 45)');
    expect(image?.getAttribute('src')).toBe(lightLogo.src);
    expect(image?.getAttribute('alt')).toBe('Enhanced brand');
  });

  it('bounds percentage image limits by chrome-safe dimensions on small viewports', () => {
    const origin = createOrigin('small-viewport');
    const viewportRuler = TestBed.inject(ViewportRuler);
    vi.spyOn(viewportRuler, 'getViewportSize').mockReturnValue({ width: 60, height: 70 });
    const service = TestBed.inject(ImageZoomService);

    service.open(request(origin, lightLogo, 'Small viewport brand', 'hover'));

    const pane = overlayContainer().querySelector<HTMLElement>('.image-zoom-overlay-pane');
    expect(pane?.style.getPropertyValue('--image-zoom-viewport-max-width')).toBe('28px');
    expect(pane?.style.getPropertyValue('--image-zoom-viewport-max-height')).toBe('38px');
    expect(pane?.style.getPropertyValue('--image-zoom-image-max-width')).toBe('2px');
    expect(pane?.style.getPropertyValue('--image-zoom-image-max-height')).toBe('12px');
  });

  it('marks only hover overlay panes as pointer-transparent', () => {
    const hoverOrigin = createOrigin('hover');
    const touchOrigin = createOrigin('touch');
    const overlay = TestBed.inject(Overlay);
    const create = vi.spyOn(overlay, 'create');
    const service = TestBed.inject(ImageZoomService);

    service.open(request(hoverOrigin, lightLogo, 'Hover brand', 'hover'));

    const hoverPane = overlayContainer().querySelector<HTMLElement>('.image-zoom-overlay-pane');
    expect(create.mock.calls[0]?.[0]?.panelClass).toEqual([
      'image-zoom-overlay-pane',
      'image-zoom-overlay-pane--pointer-transparent',
    ]);
    expect(hoverPane?.classList.contains('image-zoom-overlay-pane--pointer-transparent')).toBe(
      true,
    );

    service.open(request(touchOrigin, darkLogo, 'Touch brand', 'touch'));

    const touchPane = overlayContainer().querySelector<HTMLElement>('.image-zoom-overlay-pane');
    expect(create.mock.calls[1]?.[0]?.panelClass).toEqual(['image-zoom-overlay-pane']);
    expect(touchPane?.classList.contains('image-zoom-overlay-pane--pointer-transparent')).toBe(
      false,
    );
  });

  it('replaces the active preview and disposes the previous overlay', () => {
    const firstOrigin = createOrigin('first');
    const secondOrigin = createOrigin('second');
    const overlay = TestBed.inject(Overlay);
    const create = vi.spyOn(overlay, 'create');
    const service = TestBed.inject(ImageZoomService);

    service.open(request(firstOrigin, lightLogo, 'First brand', 'hover'));
    const firstOverlay = create.mock.results[0]?.value as OverlayRef;
    const dispose = vi.spyOn(firstOverlay, 'dispose');

    service.open(request(secondOrigin, darkLogo, 'Second brand', 'touch'));

    const previews = overlayContainer().querySelectorAll('app-image-zoom-preview');
    const panel = previews[0]?.querySelector<HTMLElement>('.image-zoom-preview');
    const image = previews[0]?.querySelector<HTMLImageElement>('img');

    expect(dispose).toHaveBeenCalledOnce();
    expect(previews).toHaveLength(1);
    expect(panel?.classList.contains('image-zoom-preview--dark')).toBe(true);
    expect(image?.getAttribute('src')).toBe(darkLogo.src);
    expect(image?.getAttribute('alt')).toBe('Second brand');
    expect(service.isOpenFor(firstOrigin)).toBe(false);
    expect(service.isOpenFor(secondOrigin, 'touch')).toBe(true);
  });

  it('toggles the same image and only honors a matching close owner', () => {
    const origin = createOrigin('toggle');
    const service = TestBed.inject(ImageZoomService);
    const touchRequest = request(origin, lightLogo, 'Toggle brand', 'touch');

    service.toggle(touchRequest);
    service.open(request(origin, lightLogo, 'Toggle brand', 'hover'));
    service.close(origin, 'hover');

    expect(service.isOpenFor(origin, 'touch')).toBe(true);

    service.toggle(touchRequest);

    expect(service.isOpenFor(origin)).toBe(false);
    expect(overlayContainer().querySelector('app-image-zoom-preview')).toBeNull();
  });

  it('keeps inside and origin interactions open while dismissing outside pointer interaction', () => {
    const origin = createOrigin('outside');
    const service = TestBed.inject(ImageZoomService);

    service.open(request(origin, lightLogo, 'Outside brand', 'touch'));

    const panel = overlayContainer().querySelector<HTMLElement>('.image-zoom-preview')!;
    dispatchPointerClick(panel);
    expect(service.isOpenFor(origin)).toBe(true);

    dispatchPointerClick(origin);
    expect(service.isOpenFor(origin)).toBe(true);

    dispatchPointerClick(document.body);
    expect(service.isOpenFor(origin)).toBe(false);
  });

  it('dismisses on Escape and disposes an active overlay when the service is destroyed', () => {
    const origin = createOrigin('escape');
    const overlay = TestBed.inject(Overlay);
    const create = vi.spyOn(overlay, 'create');
    const service = TestBed.inject(ImageZoomService);

    service.open(request(origin, lightLogo, 'Escape brand', 'hover'));
    document.body.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));

    expect(service.isOpenFor(origin)).toBe(false);

    service.open(request(origin, darkLogo, 'Destroy brand', 'touch'));
    const activeOverlay = create.mock.results[1]?.value as OverlayRef;
    const dispose = vi.spyOn(activeOverlay, 'dispose');

    TestBed.resetTestingModule();

    expect(dispose).toHaveBeenCalledOnce();
    expect(overlayContainer().querySelector('app-image-zoom-preview')).toBeNull();
  });

  /** Creates, mounts, and tracks an image suitable for CDK connected positioning. */
  function createOrigin(id: string): HTMLImageElement {
    const origin = document.createElement('img');
    origin.id = id;
    document.body.append(origin);
    origins.push(origin);
    return origin;
  }

  /** Builds a complete preview request while keeping ownership inputs explicit at call sites. */
  function request(
    origin: HTMLImageElement,
    logo: BrandLogo,
    label: string,
    activation: ImageZoomRequest['activation'],
    background?: string,
  ): ImageZoomRequest {
    return background === undefined
      ? { origin, logo, label, activation }
      : { origin, logo, label, activation, background };
  }

  /** @returns The real CDK container that receives overlay panes during the current test. */
  function overlayContainer(): HTMLElement {
    return TestBed.inject(OverlayContainer).getContainerElement();
  }

  /** Emits the pointer-down/click sequence used by CDK outside-pointer detection. */
  function dispatchPointerClick(target: Element): void {
    target.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }
});
