import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import type { BrandLogo } from '../../model/resume/resume.model';
import { ImageZoomDirective } from './image-zoom.directive';
import { ImageZoomService, type ImageZoomRequest } from './image-zoom.service';

const LOGO: BrandLogo = {
  src: '/images/test-logo.svg',
  width: 400,
  height: 200,
  surface: 'light',
};

@Component({
  imports: [ImageZoomDirective],
  template: `
    <img
      [appImageZoom]="logo()"
      [imageZoomLabel]="label()"
      [imageZoomTouch]="touchEnabled()"
      alt=""
    />
  `,
})
class ImageZoomHost {
  readonly logo = signal<BrandLogo>(LOGO);
  readonly label = signal('Test brand');
  readonly touchEnabled = signal(true);
}

describe('ImageZoomDirective', () => {
  let fixture: ComponentFixture<ImageZoomHost> | undefined;
  let imageZoomService: {
    readonly open: ReturnType<typeof vi.fn<ImageZoomService['open']>>;
    readonly toggle: ReturnType<typeof vi.fn<ImageZoomService['toggle']>>;
    readonly close: ReturnType<typeof vi.fn<ImageZoomService['close']>>;
    readonly isOpenFor: ReturnType<typeof vi.fn<ImageZoomService['isOpenFor']>>;
  };
  let resizeCallback: ResizeObserverCallback;
  let observe: ReturnType<typeof vi.fn<ResizeObserver['observe']>>;
  let disconnect: ReturnType<typeof vi.fn<ResizeObserver['disconnect']>>;

  beforeEach(async () => {
    observe = vi.fn<ResizeObserver['observe']>();
    disconnect = vi.fn<ResizeObserver['disconnect']>();
    resizeCallback = vi.fn();

    class ResizeObserverMock implements ResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
      }

      readonly observe = observe;
      readonly unobserve = vi.fn<ResizeObserver['unobserve']>();
      readonly disconnect = disconnect;

      takeRecords(): ResizeObserverEntry[] {
        return [];
      }
    }

    vi.stubGlobal('ResizeObserver', ResizeObserverMock);

    imageZoomService = {
      open: vi.fn<ImageZoomService['open']>(),
      toggle: vi.fn<ImageZoomService['toggle']>(),
      close: vi.fn<ImageZoomService['close']>(),
      isOpenFor: vi.fn<ImageZoomService['isOpenFor']>(() => false),
    };

    await TestBed.configureTestingModule({
      imports: [ImageZoomHost],
      providers: [{ provide: ImageZoomService, useValue: imageZoomService }],
    }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('opens downscaled contained images for mouse and pen hover and closes hover ownership', async () => {
    const image = await createImage();
    setImageGeometry(image, { naturalWidth: 400, naturalHeight: 100, width: 200, height: 200 });
    image.dispatchEvent(new Event('load'));
    vi.clearAllMocks();

    dispatchPointerEvent(image, 'pointerenter', 'touch');
    expect(imageZoomService.open).not.toHaveBeenCalled();

    dispatchPointerEvent(image, 'pointerenter', 'mouse');
    expect(imageZoomService.open).toHaveBeenLastCalledWith(
      request(image, LOGO, 'Test brand', 'hover'),
    );

    dispatchPointerEvent(image, 'pointerleave', 'touch');
    expect(imageZoomService.close).not.toHaveBeenCalled();

    dispatchPointerEvent(image, 'pointerleave', 'mouse');
    expect(imageZoomService.close).toHaveBeenLastCalledWith(image, 'hover');

    dispatchPointerEvent(image, 'pointerenter', 'pen');
    expect(imageZoomService.open).toHaveBeenLastCalledWith(
      request(image, LOGO, 'Test brand', 'hover'),
    );

    dispatchPointerEvent(image, 'pointerleave', 'pen');
    expect(imageZoomService.close).toHaveBeenLastCalledWith(image, 'hover');
    expect(imageZoomService.open).toHaveBeenCalledTimes(2);
    expect(imageZoomService.close).toHaveBeenCalledTimes(2);
  });

  it('keeps full-size, upscaled, and effectively equal images inert', async () => {
    const image = await createImage();
    const geometry = setImageGeometry(image, {
      naturalWidth: 200,
      naturalHeight: 100,
      width: 400,
      height: 100,
    });

    expect(image.naturalWidth).toBe(200);
    expect(image.naturalHeight).toBe(100);

    dispatchPointerEvent(image, 'pointerenter', 'mouse');
    expect(imageZoomService.open).not.toHaveBeenCalled();

    geometry.resize(400, 200);
    dispatchPointerEvent(image, 'pointerenter', 'pen');
    expect(imageZoomService.open).not.toHaveBeenCalled();

    geometry.resize(199, 99.5);
    dispatchPointerEvent(image, 'pointerenter', 'mouse');

    expect(imageZoomService.open).not.toHaveBeenCalled();

    geometry.resize(180, 90);
    dispatchPointerEvent(image, 'pointerenter', 'mouse');

    expect(imageZoomService.open).toHaveBeenCalledOnce();
  });

  it('uses natural dimensions first and falls back to valid logo metadata', async () => {
    const image = await createImage();
    const geometry = setImageGeometry(image, {
      naturalWidth: 400,
      naturalHeight: 200,
      width: 100,
      height: 50,
    });
    fixture!.componentInstance.logo.set({ ...LOGO, width: 100, height: 50 });
    await fixture!.whenStable();

    dispatchPointerEvent(image, 'pointerenter', 'mouse');
    expect(imageZoomService.open).toHaveBeenCalledOnce();

    imageZoomService.open.mockClear();
    geometry.setIntrinsicSize(0, 0);
    fixture!.componentInstance.logo.set(LOGO);
    await fixture!.whenStable();

    dispatchPointerEvent(image, 'pointerenter', 'mouse');
    expect(imageZoomService.open).toHaveBeenCalledOnce();

    imageZoomService.open.mockClear();
    fixture!.componentInstance.logo.set({ ...LOGO, width: Number.NaN, height: 0 });
    await fixture!.whenStable();

    dispatchPointerEvent(image, 'pointerenter', 'mouse');
    expect(imageZoomService.open).not.toHaveBeenCalled();
  });

  it('toggles on completed touch clicks without treating mouse or pen clicks as touch', async () => {
    const image = await createImage();
    setImageGeometry(image, { naturalWidth: 400, naturalHeight: 200, width: 200, height: 100 });

    dispatchPointerEvent(image, 'click', 'mouse');
    dispatchPointerEvent(image, 'click', 'pen');
    expect(imageZoomService.toggle).not.toHaveBeenCalled();

    dispatchPointerEvent(image, 'click', 'touch');
    dispatchPointerEvent(image, 'click', 'touch');

    expect(imageZoomService.toggle).toHaveBeenCalledTimes(2);
    expect(imageZoomService.toggle).toHaveBeenLastCalledWith(
      request(image, LOGO, 'Test brand', 'touch'),
    );
  });

  it('leaves touch clicks untouched when touch activation is disabled', async () => {
    const image = await createImage();
    setImageGeometry(image, { naturalWidth: 400, naturalHeight: 200, width: 200, height: 100 });
    fixture!.componentInstance.touchEnabled.set(false);
    await fixture!.whenStable();
    const event = pointerEvent('click', 'touch', true);

    image.dispatchEvent(event);

    expect(imageZoomService.toggle).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);

    dispatchPointerEvent(image, 'pointerenter', 'mouse');
    expect(imageZoomService.open).toHaveBeenCalledOnce();
  });

  it('re-evaluates load and resize changes and closes an ineligible active preview', async () => {
    const image = await createImage();
    const geometry = setImageGeometry(image, {
      naturalWidth: 400,
      naturalHeight: 200,
      width: 200,
      height: 100,
    });

    expect(image.naturalWidth).toBe(400);
    expect(image.naturalHeight).toBe(200);
    imageZoomService.isOpenFor.mockReturnValue(true);
    image.dispatchEvent(new Event('load'));
    vi.clearAllMocks();
    imageZoomService.isOpenFor.mockReturnValue(true);

    geometry.resize(400, 200);
    resizeCallback([], {} as ResizeObserver);

    expect(imageZoomService.close).toHaveBeenLastCalledWith(image);
    dispatchPointerEvent(image, 'pointerenter', 'mouse');
    expect(imageZoomService.open).not.toHaveBeenCalled();

    imageZoomService.close.mockClear();
    geometry.resize(200, 100);
    resizeCallback([], {} as ResizeObserver);
    expect(imageZoomService.close).not.toHaveBeenCalled();

    dispatchPointerEvent(image, 'pointerenter', 'mouse');
    expect(imageZoomService.open).toHaveBeenCalledOnce();

    imageZoomService.open.mockClear();
    geometry.resize(400, 200);
    image.dispatchEvent(new Event('load'));
    expect(imageZoomService.close).toHaveBeenLastCalledWith(image);
    dispatchPointerEvent(image, 'pointerenter', 'mouse');
    expect(imageZoomService.open).not.toHaveBeenCalled();
  });

  it('recalculates immediately before activation when ResizeObserver is unavailable', async () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const image = await createImage();
    const geometry = setImageGeometry(image, {
      naturalWidth: 400,
      naturalHeight: 200,
      width: 400,
      height: 200,
    });

    dispatchPointerEvent(image, 'pointerenter', 'mouse');
    expect(imageZoomService.open).not.toHaveBeenCalled();

    geometry.resize(200, 100);
    dispatchPointerEvent(image, 'pointerenter', 'mouse');

    expect(observe).not.toHaveBeenCalled();
    expect(imageZoomService.open).toHaveBeenCalledOnce();
  });

  it('fails safely after an image error and recovers after a later load', async () => {
    const image = await createImage();
    setImageGeometry(image, { naturalWidth: 400, naturalHeight: 200, width: 200, height: 100 });
    imageZoomService.isOpenFor.mockReturnValue(true);

    image.dispatchEvent(new Event('error'));

    expect(imageZoomService.close).toHaveBeenLastCalledWith(image);
    dispatchPointerEvent(image, 'pointerenter', 'mouse');
    dispatchPointerEvent(image, 'click', 'touch');
    expect(imageZoomService.open).not.toHaveBeenCalled();
    expect(imageZoomService.toggle).not.toHaveBeenCalled();

    image.dispatchEvent(new Event('load'));
    dispatchPointerEvent(image, 'pointerenter', 'mouse');

    expect(imageZoomService.open).toHaveBeenCalledOnce();
  });

  it('observes its image and releases both observer and owned preview on destruction', async () => {
    const image = await createImage();

    expect(observe).toHaveBeenCalledOnce();
    expect(observe).toHaveBeenCalledWith(image);

    fixture!.destroy();

    expect(disconnect).toHaveBeenCalledOnce();
    expect(imageZoomService.close).toHaveBeenLastCalledWith(image);
  });

  async function createImage(): Promise<HTMLImageElement> {
    fixture = TestBed.createComponent(ImageZoomHost);
    await fixture.whenStable();
    return fixture.nativeElement.querySelector('img') as HTMLImageElement;
  }
});

interface ImageGeometry {
  resize(width: number, height: number): void;
  setIntrinsicSize(width: number, height: number): void;
}

function setImageGeometry(
  image: HTMLImageElement,
  initial: {
    readonly naturalWidth: number;
    readonly naturalHeight: number;
    readonly width: number;
    readonly height: number;
  },
): ImageGeometry {
  let naturalWidth = initial.naturalWidth;
  let naturalHeight = initial.naturalHeight;
  let width = initial.width;
  let height = initial.height;

  image.style.border = '0';
  image.style.padding = '0';
  Object.defineProperties(image, {
    naturalWidth: { configurable: true, get: () => naturalWidth },
    naturalHeight: { configurable: true, get: () => naturalHeight },
  });
  vi.spyOn(image, 'getBoundingClientRect').mockImplementation(
    () =>
      ({
        bottom: height,
        height,
        left: 0,
        right: width,
        top: 0,
        width,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect,
  );

  return {
    resize(nextWidth: number, nextHeight: number): void {
      width = nextWidth;
      height = nextHeight;
    },
    setIntrinsicSize(nextWidth: number, nextHeight: number): void {
      naturalWidth = nextWidth;
      naturalHeight = nextHeight;
    },
  };
}

function dispatchPointerEvent(
  target: Element,
  type: string,
  pointerType: 'mouse' | 'pen' | 'touch',
): void {
  target.dispatchEvent(pointerEvent(type, pointerType));
}

function pointerEvent(
  type: string,
  pointerType: 'mouse' | 'pen' | 'touch',
  cancelable = false,
): Event {
  const event = new MouseEvent(type, { bubbles: true, cancelable });
  Object.defineProperty(event, 'pointerType', { configurable: true, value: pointerType });
  return event;
}

function request(
  origin: HTMLImageElement,
  logo: BrandLogo,
  label: string,
  activation: ImageZoomRequest['activation'],
): ImageZoomRequest {
  return { origin, logo, label, activation };
}
