/** Verifies deferred, cached, contrast-safe technology-icon enhancement. */
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import type { TechnologyIconMetadata } from '../../technology-icons.ts';
import {
  TechnologyIconContrastService,
} from './technology-icon-contrast.service.ts';
import {TechnologyIconOpenCvLoader} from '../../../../../helper/type/technology-icon-open-cv-loader.type.ts';
import {
  TECHNOLOGY_ICON_OPEN_CV_LOADER
} from '../../../../../helper/injection-token/technology-icon-open-cv-loader.function.ts';

const OPEN_CV_CDN_URL = 'https://cdn.jsdelivr.net/npm/@techstark/opencv-js/+esm';
const REMOTE_ICON_URL = 'https://resume-images.ohm-mho.space/technology-icons/test.svg';
const SECOND_REMOTE_ICON_URL = 'https://resume-images.ohm-mho.space/technology-icons/second.svg';
const ICON: TechnologyIconMetadata = {
  src: REMOTE_ICON_URL,
  width: 24,
  height: 24,
  surface: 'light',
};

const LIGHT_BACKGROUND = [255, 255, 255] as const;
const DARK_BACKGROUND = [13, 27, 45] as const;

interface TrackedAllocation {
  readonly kind: string;
  readonly delete: ReturnType<typeof vi.fn>;
}

interface FakeMat extends TrackedAllocation {
  data: Uint8Array;
  channels?: Uint8Array[];
}

interface FakeMatVector extends TrackedAllocation {
  entries: Uint8Array[];
  get(index: number): FakeMat;
  push_back(mat: FakeMat): void;
}

interface FakeOpenCvOptions {
  readonly enhanceLuminance?: (value: number) => number;
  readonly failDuringClahe?: boolean;
}

/** Creates a small deterministic OpenCV boundary with tracked native objects. */
function createFakeOpenCv(options: FakeOpenCvOptions = {}) {
  const allocations: TrackedAllocation[] = [];
  const matInputs: Uint8Array[] = [];
  const mergeInputs: Uint8Array[][] = [];
  const claheCalls: Array<{
    readonly clipLimit: number;
    readonly gridWidth: number;
    readonly gridHeight: number;
    readonly input: Uint8Array;
  }> = [];
  const enhanceLuminance = options.enhanceLuminance ?? ((value: number) => value);

  class Mat implements FakeMat {
    data: Uint8Array;
    channels?: Uint8Array[];
    readonly kind = 'Mat';
    readonly delete = vi.fn();

    constructor(data: ArrayLike<number> = []) {
      this.data = Uint8Array.from(data);
      allocations.push(this);
    }
  }

  class MatVector implements FakeMatVector {
    entries: Uint8Array[] = [];
    readonly kind = 'MatVector';
    readonly delete = vi.fn();

    constructor() {
      allocations.push(this);
    }

    get(index: number): FakeMat {
      return new Mat(this.entries[index]);
    }

    push_back(mat: FakeMat): void {
      this.entries.push(Uint8Array.from(mat.data));
    }
  }

  class Size implements TrackedAllocation {
    readonly kind = 'Size';
    readonly delete = vi.fn();

    constructor(
      readonly width: number,
      readonly height: number,
    ) {
      allocations.push(this);
    }
  }

  class CLAHE implements TrackedAllocation {
    readonly kind = 'CLAHE';
    readonly delete = vi.fn();
    readonly collectGarbage = vi.fn();

    constructor(
      private readonly clipLimit: number,
      private readonly grid: Size,
    ) {
      allocations.push(this);
    }

    apply(source: FakeMat, destination: FakeMat): void {
      claheCalls.push({
        clipLimit: this.clipLimit,
        gridWidth: this.grid.width,
        gridHeight: this.grid.height,
        input: Uint8Array.from(source.data),
      });
      if (options.failDuringClahe) {
        throw new Error('Synthetic CLAHE failure');
      }
      destination.data = Uint8Array.from(source.data, enhanceLuminance);
    }
  }

  const COLOR_RGBA2RGB = 1;
  const COLOR_RGB2Lab = 2;
  const COLOR_Lab2RGB = 3;

  const cv = {
    Mat,
    MatVector,
    Size,
    CLAHE,
    COLOR_RGBA2RGB,
    COLOR_RGB2Lab,
    COLOR_Lab2RGB,
    matFromImageData: vi.fn((imageData: ImageData) => {
      matInputs.push(Uint8Array.from(imageData.data));
      return new Mat(imageData.data);
    }),
    cvtColor: vi.fn((source: FakeMat, destination: FakeMat, code: number) => {
      if (code === COLOR_RGBA2RGB) {
        const rgb = new Uint8Array((source.data.length / 4) * 3);
        for (let sourceIndex = 0, targetIndex = 0; sourceIndex < source.data.length;) {
          rgb[targetIndex++] = source.data[sourceIndex++];
          rgb[targetIndex++] = source.data[sourceIndex++];
          rgb[targetIndex++] = source.data[sourceIndex++];
          sourceIndex++;
        }
        destination.data = rgb;
        return;
      }

      if (code === COLOR_RGB2Lab) {
        const pixelCount = source.data.length / 3;
        destination.channels = [
          new Uint8Array(pixelCount),
          new Uint8Array(pixelCount),
          new Uint8Array(pixelCount),
        ];
        for (let index = 0; index < pixelCount; index++) {
          destination.channels[0][index] = source.data[index * 3];
          destination.channels[1][index] = source.data[index * 3 + 1];
          destination.channels[2][index] = source.data[index * 3 + 2];
        }
        return;
      }

      if (code === COLOR_Lab2RGB && destination !== undefined) {
        const channels = source.channels ?? [];
        const rgb = new Uint8Array((channels[0]?.length ?? 0) * 3);
        for (let index = 0; index < (channels[0]?.length ?? 0); index++) {
          rgb[index * 3] = channels[0][index];
          rgb[index * 3 + 1] = channels[1][index];
          rgb[index * 3 + 2] = channels[2][index];
        }
        destination.data = rgb;
      }
    }),
    split: vi.fn((source: FakeMat, destination: FakeMatVector) => {
      destination.entries = (source.channels ?? []).map((channel) => Uint8Array.from(channel));
    }),
    merge: vi.fn((source: FakeMatVector, destination: FakeMat) => {
      mergeInputs.push(source.entries.map((channel) => Uint8Array.from(channel)));
      destination.channels = source.entries.map((channel) => Uint8Array.from(channel));
    }),
  };

  return { allocations, claheCalls, cv, matInputs, mergeInputs };
}

/** Builds source pixels with one foreground pixel and a transparent remainder. */
function createSourcePixels(
  foreground: readonly [number, number, number, number] = [128, 128, 128, 255],
): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(ICON.width * ICON.height * 4);
  pixels.set(foreground);
  for (let index = 4; index < pixels.length; index += 4) {
    pixels.set([219, 17, 191, 0], index);
  }
  return pixels;
}

describe('TechnologyIconContrastService', () => {
  let idleCallbacks: IdleRequestCallback[];
  let sourcePixels: Uint8ClampedArray;
  let serializedPixels: Uint8ClampedArray[];
  let imageLoadCount: number;
  let imageRequests: Array<{ readonly crossOrigin: string | null; readonly src: string }>;
  let failImageLoading: boolean;
  let canvasAvailable: boolean;
  let failCanvasReading: boolean;

  beforeEach(() => {
    idleCallbacks = [];
    sourcePixels = createSourcePixels();
    serializedPixels = [];
    imageLoadCount = 0;
    imageRequests = [];
    failImageLoading = false;
    canvasAvailable = true;
    failCanvasReading = false;

    vi.stubGlobal(
      'requestIdleCallback',
      vi.fn((callback: IdleRequestCallback) => {
        idleCallbacks.push(callback);
        return idleCallbacks.length;
      }),
    );
    vi.stubGlobal('cancelIdleCallback', vi.fn());

    class FakeImage {
      onload: ((event: Event) => void) | null = null;
      onerror: ((event: Event | string) => void) | null = null;
      decoding = '';
      crossOrigin: string | null = null;

      set src(value: string) {
        imageLoadCount++;
        imageRequests.push({ crossOrigin: this.crossOrigin, src: value });
        queueMicrotask(() => {
          if (failImageLoading) {
            this.onerror?.(new Event('error'));
          } else {
            this.onload?.(new Event('load'));
          }
        });
      }
    }
    vi.stubGlobal('Image', FakeImage);

    const context = {
      drawImage: vi.fn(),
      getImageData: vi.fn((_x: number, _y: number, width: number, height: number): ImageData => {
        if (failCanvasReading) {
          throw new DOMException('Synthetic cross-origin canvas failure', 'SecurityError');
        }
        return { data: sourcePixels, width, height, colorSpace: 'srgb' } as ImageData;
      }),
      createImageData: vi.fn(
        (width: number, height: number): ImageData =>
          ({
            data: new Uint8ClampedArray(width * height * 4),
            width,
            height,
            colorSpace: 'srgb',
          }) as ImageData,
      ),
      putImageData: vi.fn((imageData: ImageData) => {
        serializedPixels.push(Uint8ClampedArray.from(imageData.data));
      }),
    };

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => (canvasAvailable ? context : null) as ReturnType<HTMLCanvasElement['getContext']>,
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/png;base64,optimized',
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  /** Configures the singleton with a controlled dynamic-import replacement. */
  function createService(
    loader: TechnologyIconOpenCvLoader,
    platformId: 'browser' | 'server' = 'browser',
  ): TechnologyIconContrastService {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: platformId },
        { provide: TECHNOLOGY_ICON_OPEN_CV_LOADER, useValue: loader },
      ],
    });
    return TestBed.inject(TechnologyIconContrastService);
  }

  /** Runs every currently queued idle task with deterministic available time. */
  function runIdleTasks(): void {
    for (const callback of idleCallbacks.splice(0)) {
      callback({ didTimeout: false, timeRemaining: () => 50 });
    }
  }

  it('requests anonymous CORS, evaluates both surfaces, and applies CLAHE only to luminance', async () => {
    const fake = createFakeOpenCv({ enhanceLuminance: () => 255 });
    const loader = vi.fn(async () => ({ default: fake.cv }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const service = createService(loader);

    const pending = service.optimize(ICON);

    expect(loader).not.toHaveBeenCalled();
    expect(imageLoadCount).toBe(0);
    expect(idleCallbacks).toHaveLength(1);

    runIdleTasks();
    const presentation = await pending;

    expect(loader).toHaveBeenCalledExactlyOnceWith(OPEN_CV_CDN_URL);
    expect(imageRequests).toEqual([{ crossOrigin: 'anonymous', src: REMOTE_ICON_URL }]);
    expect(fake.claheCalls).toHaveLength(2);
    expect(fake.claheCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ clipLimit: 2, gridWidth: 2, gridHeight: 2 }),
      ]),
    );
    expect(fake.matInputs).toHaveLength(2);
    expect([...fake.matInputs[0].slice(4, 7)]).toEqual(LIGHT_BACKGROUND);
    expect([...fake.matInputs[1].slice(4, 7)]).toEqual(DARK_BACKGROUND);
    expect(fake.mergeInputs).toHaveLength(2);
    expect(fake.mergeInputs[0][1][0]).toBe(128);
    expect(fake.mergeInputs[0][2][0]).toBe(128);
    expect(presentation).toEqual({
      logo: {
        src: 'data:image/png;base64,optimized',
        width: 24,
        height: 24,
        surface: 'dark',
      },
      backgroundColor: '#0d1b2d',
    });
    expect([...serializedPixels.at(-1)!.slice(0, 4)]).toEqual([255, 128, 128, 255]);
    expect([...serializedPixels.at(-1)!.slice(4, 8)]).toEqual([13, 27, 45, 255]);
    expect(fake.allocations.every((allocation) => allocation.delete.mock.calls.length === 1)).toBe(
      true,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('retries loading and normalization at fixed one-second intervals before recovering', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    sourcePixels = createSourcePixels([0, 0, 0, 0]);
    const fake = createFakeOpenCv();
    const attemptTimes: number[] = [];
    const loader = vi.fn(async (_sourceUrl: string) => {
      attemptTimes.push(Date.now());
      const attempt = attemptTimes.length;
      if (attempt === 1 || attempt === 3) {
        throw new Error(`Synthetic CDN failure ${attempt}`);
      }
      return attempt === 2 ? undefined : { default: fake.cv };
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const service = createService(loader);

    const pending = service.optimize(ICON);
    runIdleTasks();
    await vi.advanceTimersByTimeAsync(0);

    expect(loader).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(999);
    expect(loader).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(loader).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(loader).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(1_000);

    await expect(pending).resolves.toEqual(expect.objectContaining({ backgroundColor: '#ffffff' }));
    expect(attemptTimes).toEqual([0, 1_000, 2_000, 3_000]);
    expect(loader.mock.calls.map(([sourceUrl]) => sourceUrl)).toEqual([
      OPEN_CV_CDN_URL,
      `${OPEN_CV_CDN_URL}?retry=1`,
      `${OPEN_CV_CDN_URL}?retry=2`,
      `${OPEN_CV_CDN_URL}?retry=3`,
    ]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('shares exhausted retries and warns once across concurrent and later icons', async () => {
    vi.useFakeTimers();
    const loader = vi.fn(async (_sourceUrl: string) => {
      throw new Error('Synthetic persistent CDN failure');
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const service = createService(loader);
    const secondIcon = { ...ICON, src: SECOND_REMOTE_ICON_URL };

    const first = service.optimize(ICON);
    const second = service.optimize(secondIcon);
    runIdleTasks();
    await vi.advanceTimersByTimeAsync(0);
    expect(loader).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(loader).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(loader).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(loader).toHaveBeenCalledTimes(4);
    await vi.advanceTimersByTimeAsync(0);

    await expect(Promise.all([first, second])).resolves.toEqual([
      { logo: ICON, backgroundColor: '#ffffff' },
      { logo: secondIcon, backgroundColor: '#ffffff' },
    ]);
    expect(loader.mock.calls.map(([sourceUrl]) => sourceUrl)).toEqual([
      OPEN_CV_CDN_URL,
      `${OPEN_CV_CDN_URL}?retry=1`,
      `${OPEN_CV_CDN_URL}?retry=2`,
      `${OPEN_CV_CDN_URL}?retry=3`,
    ]);
    expect(warn).toHaveBeenCalledOnce();

    const laterIcon = { ...ICON, src: `${REMOTE_ICON_URL}?later` };
    const later = service.optimize(laterIcon);
    runIdleTasks();
    await vi.advanceTimersByTimeAsync(0);

    await expect(later).resolves.toEqual({ logo: laterIcon, backgroundColor: '#ffffff' });
    expect(loader).toHaveBeenCalledTimes(4);
    expect(warn).toHaveBeenCalledOnce();
    expect(imageLoadCount).toBe(0);
  });

  it('does not load or warn outside the browser', async () => {
    const fake = createFakeOpenCv();
    const loader = vi.fn(async () => ({ default: fake.cv }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const service = createService(loader, 'server');

    await expect(service.optimize(ICON)).resolves.toEqual({
      logo: ICON,
      backgroundColor: '#ffffff',
    });
    expect(idleCallbacks).toHaveLength(0);
    expect(loader).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([
    ['an immediate export', (cv: unknown) => ({ default: cv })],
    ['a promise export', (cv: unknown) => ({ default: Promise.resolve(cv) })],
  ] as const)(
    'normalizes %s and initializes the shared runtime once',
    async (_label, exportValue) => {
      sourcePixels = createSourcePixels([0, 0, 0, 0]);
      const fake = createFakeOpenCv();
      const loader = vi.fn(async () => exportValue(fake.cv));
      const service = createService(loader);

      const first = service.optimize(ICON);
      const second = service.optimize({ ...ICON, src: SECOND_REMOTE_ICON_URL });
      runIdleTasks();

      await expect(Promise.all([first, second])).resolves.toHaveLength(2);
      expect(loader).toHaveBeenCalledOnce();
    },
  );

  it('waits for an onRuntimeInitialized export before processing', async () => {
    sourcePixels = createSourcePixels([0, 0, 0, 0]);
    const fake = createFakeOpenCv();
    const delayedRuntime = {
      ...fake.cv,
      Mat: undefined as unknown,
      onRuntimeInitialized: undefined as (() => void) | undefined,
    };
    const loader = vi.fn(async () => ({ default: delayedRuntime }));
    const service = createService(loader);

    const pending = service.optimize(ICON);
    runIdleTasks();
    await vi.waitFor(() => expect(typeof delayedRuntime.onRuntimeInitialized).toBe('function'));
    expect(imageLoadCount).toBe(0);

    delayedRuntime.Mat = fake.cv.Mat;
    delayedRuntime.onRuntimeInitialized?.();

    await expect(pending).resolves.toEqual(expect.objectContaining({ backgroundColor: '#ffffff' }));
    expect(loader).toHaveBeenCalledOnce();
  });

  it('uses the original candidate unless CLAHE strictly improves its measured contrast', async () => {
    sourcePixels = createSourcePixels([0, 0, 0, 255]);
    const fake = createFakeOpenCv({ enhanceLuminance: () => 255 });
    const service = createService(vi.fn(async () => ({ default: fake.cv })));

    const pending = service.optimize(ICON);
    runIdleTasks();
    const presentation = await pending;

    // Black on white remains stronger than the fake red luminance adjustment.
    expect(presentation.backgroundColor).toBe('#ffffff');
    expect([...serializedPixels.at(-1)!.slice(0, 4)]).toEqual([0, 0, 0, 255]);
    expect(fake.claheCalls).toHaveLength(2);
  });

  it('uses a timer when requestIdleCallback is unavailable', async () => {
    vi.stubGlobal('requestIdleCallback', undefined);
    sourcePixels = createSourcePixels([0, 0, 0, 0]);
    const fake = createFakeOpenCv();
    const loader = vi.fn(async () => ({ default: fake.cv }));
    const service = createService(loader);

    const pending = service.optimize(ICON);

    expect(loader).not.toHaveBeenCalled();
    await expect(pending).resolves.toEqual(expect.objectContaining({ backgroundColor: '#ffffff' }));
    expect(loader).toHaveBeenCalledOnce();
  });

  it('selects the light surface for an exact score tie', async () => {
    sourcePixels = createSourcePixels([91, 72, 53, 0]);
    const fake = createFakeOpenCv({ enhanceLuminance: () => 0 });
    const service = createService(vi.fn(async () => ({ default: fake.cv })));

    const pending = service.optimize(ICON);
    runIdleTasks();
    const presentation = await pending;

    expect(presentation.backgroundColor).toBe('#ffffff');
    expect(presentation.logo.surface).toBe('light');
    expect([...serializedPixels.at(-1)!.slice(0, 4)]).toEqual([255, 255, 255, 255]);
  });

  it('deduplicates identical work by source and intrinsic dimensions', async () => {
    sourcePixels = createSourcePixels([0, 0, 0, 0]);
    const fake = createFakeOpenCv();
    const loader = vi.fn(async () => ({ default: fake.cv }));
    const service = createService(loader);

    const first = service.optimize(ICON);
    const duplicate = service.optimize({ ...ICON });
    const resized = service.optimize({ ...ICON, width: 32 });

    expect(duplicate).toBe(first);
    expect(resized).not.toBe(first);
    expect(idleCallbacks).toHaveLength(2);

    runIdleTasks();
    await Promise.all([first, duplicate, resized]);

    expect(loader).toHaveBeenCalledOnce();
    expect(imageLoadCount).toBe(2);
  });

  it.each(['image', 'canvas', 'cross-origin canvas access'] as const)(
    'resolves to the original light presentation after a %s failure',
    async (failure) => {
      const fake = createFakeOpenCv();
      const loader = vi.fn(async () => ({ default: fake.cv }));
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      failImageLoading = failure === 'image';
      canvasAvailable = failure !== 'canvas';
      failCanvasReading = failure === 'cross-origin canvas access';
      const service = createService(loader);

      const pending = service.optimize(ICON);
      runIdleTasks();

      const presentation = await pending;

      expect(presentation).toEqual({
        logo: ICON,
        backgroundColor: '#ffffff',
      });
      expect(presentation.logo.src).toBe(REMOTE_ICON_URL);
      expect(loader).toHaveBeenCalledOnce();
      expect(warn).not.toHaveBeenCalled();
    },
  );

  it('cleans up every OpenCV allocation when processing throws', async () => {
    const fake = createFakeOpenCv({ failDuringClahe: true });
    const loader = vi.fn(async () => ({ default: fake.cv }));
    const service = createService(loader);

    const pending = service.optimize(ICON);
    runIdleTasks();

    await expect(pending).resolves.toEqual({ logo: ICON, backgroundColor: '#ffffff' });
    expect(fake.allocations.length).toBeGreaterThan(0);
    expect(fake.allocations.every((allocation) => allocation.delete.mock.calls.length === 1)).toBe(
      true,
    );
    expect(loader).toHaveBeenCalledOnce();
  });
});
