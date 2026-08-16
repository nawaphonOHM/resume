import {
  Overlay,
  OverlayContainer,
  type ConnectedPosition,
  type OverlayRef,
} from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import type { BrandLogo } from '../../model/resume/resume.model';
import { ImageZoomService, type ImageZoomRequest } from './image-zoom.service';

interface PositionStrategyState {
  readonly _origin: Element;
  readonly _preferredPositions: readonly ConnectedPosition[];
  readonly _viewportMargin: number;
  readonly _hasFlexibleDimensions: boolean;
  readonly _growAfterOpen: boolean;
  readonly _canPush: boolean;
}

describe('ImageZoomService', () => {
  const lightLogo: BrandLogo = {
    src: '/images/light-logo.svg',
    width: 480,
    height: 240,
    surface: 'light',
  };
  const darkLogo: BrandLogo = {
    src: '/images/dark-logo.svg',
    width: 360,
    height: 360,
    surface: 'dark',
  };
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
    const create = vi.spyOn(overlay, 'create');
    const reposition = vi.spyOn(overlay.scrollStrategies, 'reposition');
    const service = TestBed.inject(ImageZoomService);

    service.open(request(origin, lightLogo, 'Light brand', 'hover'));

    const config = create.mock.calls[0]?.[0];
    const position = config?.positionStrategy as unknown as PositionStrategyState;
    const preview = overlayContainer().querySelector<HTMLElement>('app-image-zoom-preview');
    const image = preview?.querySelector<HTMLImageElement>('img');

    expect(create).toHaveBeenCalledTimes(1);
    expect(reposition).toHaveBeenCalledWith({ scrollThrottle: 0 });
    expect(config).toMatchObject({
      disposeOnNavigation: true,
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: 'calc(100vh - 32px)',
      panelClass: 'image-zoom-overlay-pane',
    });
    expect(position._origin).toBe(origin);
    expect(position._viewportMargin).toBe(16);
    expect(position._hasFlexibleDimensions).toBe(true);
    expect(position._growAfterOpen).toBe(true);
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
    expect(preview?.getAttribute('aria-hidden')).toBe('true');
    expect(image?.getAttribute('src')).toBe(lightLogo.src);
    expect(image?.getAttribute('alt')).toBe('Light brand');
    expect(service.isOpenFor(origin, 'hover')).toBe(true);
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

  function createOrigin(id: string): HTMLImageElement {
    const origin = document.createElement('img');
    origin.id = id;
    document.body.append(origin);
    origins.push(origin);
    return origin;
  }

  function request(
    origin: HTMLImageElement,
    logo: BrandLogo,
    label: string,
    activation: ImageZoomRequest['activation'],
  ): ImageZoomRequest {
    return { origin, logo, label, activation };
  }

  function overlayContainer(): HTMLElement {
    return TestBed.inject(OverlayContainer).getContainerElement();
  }

  function dispatchPointerClick(target: Element): void {
    target.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }
});
