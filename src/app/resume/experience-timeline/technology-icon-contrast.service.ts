import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, InjectionToken, PLATFORM_ID, inject } from '@angular/core';

import type { BrandLogo } from '../../model/resume/resume.model';
import type { TechnologyIconMetadata } from './technology-icons';

/** Exact card colors considered for every technology icon. */
export type TechnologyIconBackgroundColor = '#ffffff' | '#0d1b2d';

/** Resolved artwork and the exact card surface on which it was evaluated. */
export interface TechnologyIconPresentation {
  readonly logo: BrandLogo;
  readonly backgroundColor: TechnologyIconBackgroundColor;
}

/** Deferred OpenCV module loader, replaceable at the browser boundary in tests. */
export type TechnologyIconOpenCvLoader = () => Promise<unknown>;

/**
 * Loader whose factory keeps OpenCV out of the initial bundle and does no work
 * until the returned function is called from a scheduled enhancement.
 */
export const TECHNOLOGY_ICON_OPEN_CV_LOADER = new InjectionToken<TechnologyIconOpenCvLoader>(
  'TECHNOLOGY_ICON_OPEN_CV_LOADER',
  {
    providedIn: 'root',
    factory: () => () => import('@techstark/opencv-js') as Promise<unknown>,
  },
);

interface CardSurface {
  readonly backgroundColor: TechnologyIconBackgroundColor;
  readonly rgb: readonly [number, number, number];
  readonly tone: 'light' | 'dark';
}

interface Candidate {
  readonly pixels: Uint8ClampedArray;
  readonly score: number;
  readonly surface: CardSurface;
}

interface RasterizedIcon {
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  readonly pixels: Uint8ClampedArray;
}

interface Disposable {
  delete?(): unknown;
}

interface Deletable extends Disposable {
  delete(): unknown;
}

interface OpenCvMat extends Deletable {
  readonly data: ArrayLike<number>;
}

interface OpenCvMatVector extends Deletable {
  get(index: number): OpenCvMat;
  push_back(mat: OpenCvMat): unknown;
}

interface OpenCvSize extends Disposable {}

interface OpenCvClahe extends Deletable {
  apply(source: OpenCvMat, destination: OpenCvMat): void;
  collectGarbage?(): void;
}

interface OpenCvRuntime {
  readonly Mat: new () => OpenCvMat;
  readonly MatVector: new () => OpenCvMatVector;
  readonly Size: new (width: number, height: number) => OpenCvSize;
  readonly CLAHE: new (clipLimit: number, tileGridSize: OpenCvSize) => OpenCvClahe;
  readonly COLOR_RGBA2RGB: number;
  readonly COLOR_RGB2Lab: number;
  readonly COLOR_Lab2RGB: number;
  matFromImageData(imageData: ImageData): OpenCvMat;
  cvtColor(source: OpenCvMat, destination: OpenCvMat, code: number): void;
  split(source: OpenCvMat, destination: OpenCvMatVector): void;
  merge(source: OpenCvMatVector, destination: OpenCvMat): void;
}

interface InitializingOpenCvExport {
  Mat?: unknown;
  onAbort?: (reason: unknown) => void;
  onRuntimeInitialized?: () => void;
}

const LIGHT_SURFACE: CardSurface = {
  backgroundColor: '#ffffff',
  rgb: [255, 255, 255],
  tone: 'light',
};

const DARK_SURFACE: CardSurface = {
  backgroundColor: '#0d1b2d',
  rgb: [13, 27, 45],
  tone: 'dark',
};

const CARD_SURFACES = [LIGHT_SURFACE, DARK_SURFACE] as const;
const CLAHE_CLIP_LIMIT = 2;
const CLAHE_TILE_PIXEL_TARGET = 16;
const MIN_CLAHE_TILES = 2;
const MAX_CLAHE_TILES = 8;
const IDLE_TIMEOUT_MS = 1_000;
const RUNTIME_INITIALIZATION_TIMEOUT_MS = 15_000;

/** Returns whether an unknown module value is promise-like. */
function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    ((typeof value === 'object' && value !== null) || typeof value === 'function') &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  );
}

/** Unwraps the default value emitted when the CommonJS package is imported. */
function unwrapDefaultExport(value: unknown): unknown {
  if (typeof value !== 'object' || value === null || !('default' in value)) {
    return value;
  }

  const defaultExport = (value as { readonly default?: unknown }).default;
  return defaultExport === undefined || defaultExport === value ? value : defaultExport;
}

/** A constructed `Mat` class marks a fully initialized OpenCV runtime. */
function isOpenCvRuntime(value: unknown): value is OpenCvRuntime {
  return (
    ((typeof value === 'object' && value !== null) || typeof value === 'function') &&
    typeof (value as { readonly Mat?: unknown }).Mat === 'function'
  );
}

/** Waits for the callback-style Emscripten runtime without leaking failures. */
function waitForRuntimeInitialization(candidate: InitializingOpenCvExport): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const previousInitialized = candidate.onRuntimeInitialized;
    const previousAbort = candidate.onAbort;
    const timer = setTimeout(() => {
      finish(() => reject(new Error('OpenCV runtime initialization timed out')));
    }, RUNTIME_INITIALIZATION_TIMEOUT_MS);

    const finish = (completion: () => void): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      completion();
    };

    candidate.onRuntimeInitialized = () => {
      try {
        previousInitialized?.call(candidate);
        finish(resolve);
      } catch (error) {
        finish(() => reject(error));
      }
    };
    candidate.onAbort = (reason: unknown) => {
      try {
        previousAbort?.call(candidate, reason);
      } finally {
        finish(() => reject(new Error('OpenCV runtime initialization aborted')));
      }
    };

    if (isOpenCvRuntime(candidate)) {
      finish(resolve);
    }
  });
}

/** Normalizes namespace, promise, and callback-initialized package exports. */
async function normalizeOpenCvExport(moduleValue: unknown): Promise<OpenCvRuntime> {
  let candidate = moduleValue;

  for (let attempt = 0; attempt < 4; attempt++) {
    candidate = unwrapDefaultExport(candidate);
    if (!isPromiseLike(candidate)) {
      break;
    }
    candidate = await candidate;
  }

  candidate = unwrapDefaultExport(candidate);
  if (isOpenCvRuntime(candidate)) {
    return candidate;
  }
  if ((typeof candidate !== 'object' || candidate === null) && typeof candidate !== 'function') {
    throw new Error('OpenCV module did not expose a runtime');
  }

  await waitForRuntimeInitialization(candidate as InitializingOpenCvExport);
  if (!isOpenCvRuntime(candidate)) {
    throw new Error('OpenCV runtime initialized without Mat support');
  }
  return candidate;
}

/** Best-effort native allocation cleanup that cannot mask the usable fallback. */
function dispose(allocation: Disposable | undefined): void {
  try {
    allocation?.delete?.();
  } catch {
    // A failed native cleanup must not surface as an application error.
  }
}

/** Converts one sRGB channel to its linear-light value. */
function linearizeChannel(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

/** Calculates WCAG relative luminance for an RGB pixel. */
function relativeLuminance(red: number, green: number, blue: number): number {
  return (
    0.2126 * linearizeChannel(red) +
    0.7152 * linearizeChannel(green) +
    0.0722 * linearizeChannel(blue)
  );
}

/**
 * Lazily rasterizes and contrast-optimizes technology artwork once per unique
 * source and intrinsic size for the lifetime of the root service.
 */
@Injectable({ providedIn: 'root' })
export class TechnologyIconContrastService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly openCvLoader = inject(TECHNOLOGY_ICON_OPEN_CV_LOADER);
  private readonly view = isPlatformBrowser(this.platformId) ? this.document.defaultView : null;
  private readonly presentations = new Map<string, Promise<TechnologyIconPresentation>>();
  private openCvRuntime: Promise<OpenCvRuntime> | undefined;

  /**
   * Returns cached optimized artwork, resolving safely to the original SVG and
   * light card whenever browser, image, canvas, or OpenCV work fails.
   */
  optimize(icon: TechnologyIconMetadata): Promise<TechnologyIconPresentation> {
    const cacheKey = `${icon.src}\u0000${icon.width}x${icon.height}`;
    const cached = this.presentations.get(cacheKey);
    if (cached) {
      return cached;
    }

    const fallback = this.createFallback(icon);
    const pending = this.view
      ? this.waitForIdle()
          .then(() => this.enhance(icon))
          .catch(() => fallback)
      : Promise.resolve(fallback);
    this.presentations.set(cacheKey, pending);
    return pending;
  }

  /** Preserves the current usable SVG and frame when enhancement is unavailable. */
  private createFallback(icon: TechnologyIconMetadata): TechnologyIconPresentation {
    return { logo: icon, backgroundColor: LIGHT_SURFACE.backgroundColor };
  }

  /** Schedules heavy runtime and canvas work after the initial render. */
  private waitForIdle(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.view?.requestIdleCallback) {
        this.view.requestIdleCallback(() => resolve(), { timeout: IDLE_TIMEOUT_MS });
      } else {
        this.view?.setTimeout(resolve, 0);
      }
    });
  }

  /** Loads and initializes the package at most once after idle work begins. */
  private loadOpenCv(): Promise<OpenCvRuntime> {
    this.openCvRuntime ??= Promise.resolve()
      .then(() => this.openCvLoader())
      .then((moduleValue) => normalizeOpenCvExport(moduleValue));
    return this.openCvRuntime;
  }

  /** Runs the complete rasterize, evaluate, select, and serialize pipeline. */
  private async enhance(icon: TechnologyIconMetadata): Promise<TechnologyIconPresentation> {
    if (
      !Number.isInteger(icon.width) ||
      !Number.isInteger(icon.height) ||
      icon.width <= 0 ||
      icon.height <= 0
    ) {
      throw new Error('Technology icon dimensions must be positive integers');
    }

    const cv = await this.loadOpenCv();
    const rasterized = await this.rasterize(icon);
    const candidates = CARD_SURFACES.map((surface) =>
      this.evaluateCandidate(cv, rasterized.context, rasterized.pixels, icon, surface),
    );
    const winner = candidates[1].score > candidates[0].score ? candidates[1] : candidates[0];
    const imageData = rasterized.context.createImageData(icon.width, icon.height);
    imageData.data.set(winner.pixels);
    rasterized.context.putImageData(imageData, 0, 0);
    const source = rasterized.canvas.toDataURL('image/png');
    if (!source.startsWith('data:image/png')) {
      throw new Error('Canvas did not produce PNG artwork');
    }

    return {
      logo: {
        src: source,
        width: icon.width,
        height: icon.height,
        surface: winner.surface.tone,
      },
      backgroundColor: winner.surface.backgroundColor,
    };
  }

  /** Loads the local SVG and retains its untouched alpha mask as RGBA pixels. */
  private async rasterize(icon: TechnologyIconMetadata): Promise<RasterizedIcon> {
    if (!this.view) {
      throw new Error('Technology icon rasterization requires a browser');
    }

    const image = new this.view.Image();
    image.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Technology icon could not be loaded'));
      image.src = icon.src;
    });

    const canvas = this.document.createElement('canvas');
    canvas.width = icon.width;
    canvas.height = icon.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      throw new Error('Technology icon canvas is unavailable');
    }
    context.drawImage(image, 0, 0, icon.width, icon.height);
    const imageData = context.getImageData(0, 0, icon.width, icon.height);
    if (imageData.data.length !== icon.width * icon.height * 4) {
      throw new Error('Technology icon rasterization returned invalid pixels');
    }

    return {
      canvas,
      context,
      pixels: Uint8ClampedArray.from(imageData.data),
    };
  }

  /** Compares untouched and CLAHE-adjusted artwork on one exact card surface. */
  private evaluateCandidate(
    cv: OpenCvRuntime,
    context: CanvasRenderingContext2D,
    source: Uint8ClampedArray,
    icon: TechnologyIconMetadata,
    surface: CardSurface,
  ): Candidate {
    const original = this.composite(source, surface.rgb);
    const enhancedRgb = this.applyClahe(cv, context, original, icon.width, icon.height);
    const enhanced = this.blendWithSurface(enhancedRgb, source, surface.rgb);
    const originalScore = this.scoreContrast(original, source, surface.rgb);
    const enhancedScore = this.scoreContrast(enhanced, source, surface.rgb);

    return enhancedScore > originalScore
      ? { pixels: enhanced, score: enhancedScore, surface }
      : { pixels: original, score: originalScore, surface };
  }

  /** Composites original SVG pixels over an opaque card color. */
  private composite(
    source: Uint8ClampedArray,
    background: readonly [number, number, number],
  ): Uint8ClampedArray {
    const result = new Uint8ClampedArray(source.length);
    for (let index = 0; index < source.length; index += 4) {
      const alpha = source[index + 3] / 255;
      result[index] = Math.round(source[index] * alpha + background[0] * (1 - alpha));
      result[index + 1] = Math.round(source[index + 1] * alpha + background[1] * (1 - alpha));
      result[index + 2] = Math.round(source[index + 2] * alpha + background[2] * (1 - alpha));
      result[index + 3] = 255;
    }
    return result;
  }

  /** Applies low-strength CLAHE to Lab luminance while retaining both chroma channels. */
  private applyClahe(
    cv: OpenCvRuntime,
    context: CanvasRenderingContext2D,
    pixels: Uint8ClampedArray,
    width: number,
    height: number,
  ): Uint8Array {
    let rgba: OpenCvMat | undefined;
    let rgb: OpenCvMat | undefined;
    let lab: OpenCvMat | undefined;
    let channels: OpenCvMatVector | undefined;
    let luminance: OpenCvMat | undefined;
    let firstChroma: OpenCvMat | undefined;
    let secondChroma: OpenCvMat | undefined;
    let enhancedLuminance: OpenCvMat | undefined;
    let tileGrid: OpenCvSize | undefined;
    let clahe: OpenCvClahe | undefined;
    let enhancedChannels: OpenCvMatVector | undefined;
    let enhancedLab: OpenCvMat | undefined;
    let enhancedRgb: OpenCvMat | undefined;

    try {
      const imageData = context.createImageData(width, height);
      imageData.data.set(pixels);
      rgba = cv.matFromImageData(imageData);
      rgb = new cv.Mat();
      lab = new cv.Mat();
      cv.cvtColor(rgba, rgb, cv.COLOR_RGBA2RGB);
      cv.cvtColor(rgb, lab, cv.COLOR_RGB2Lab);

      channels = new cv.MatVector();
      cv.split(lab, channels);
      luminance = channels.get(0);
      firstChroma = channels.get(1);
      secondChroma = channels.get(2);
      enhancedLuminance = new cv.Mat();
      tileGrid = new cv.Size(this.tileCount(width), this.tileCount(height));
      clahe = new cv.CLAHE(CLAHE_CLIP_LIMIT, tileGrid);
      clahe.apply(luminance, enhancedLuminance);

      enhancedChannels = new cv.MatVector();
      enhancedChannels.push_back(enhancedLuminance);
      enhancedChannels.push_back(firstChroma);
      enhancedChannels.push_back(secondChroma);
      enhancedLab = new cv.Mat();
      cv.merge(enhancedChannels, enhancedLab);
      enhancedRgb = new cv.Mat();
      cv.cvtColor(enhancedLab, enhancedRgb, cv.COLOR_Lab2RGB);

      const result = Uint8Array.from(enhancedRgb.data);
      if (result.length !== width * height * 3) {
        throw new Error('OpenCV returned invalid enhanced pixels');
      }
      return result;
    } finally {
      try {
        clahe?.collectGarbage?.();
      } catch {
        // Continue releasing every allocation when CLAHE cleanup itself fails.
      }
      dispose(enhancedRgb);
      dispose(enhancedLab);
      dispose(enhancedChannels);
      dispose(clahe);
      dispose(tileGrid);
      dispose(enhancedLuminance);
      dispose(secondChroma);
      dispose(firstChroma);
      dispose(luminance);
      dispose(channels);
      dispose(lab);
      dispose(rgb);
      dispose(rgba);
    }
  }

  /** Chooses an adaptive tile count independently for each intrinsic dimension. */
  private tileCount(dimension: number): number {
    return Math.max(
      MIN_CLAHE_TILES,
      Math.min(MAX_CLAHE_TILES, Math.ceil(dimension / CLAHE_TILE_PIXEL_TARGET)),
    );
  }

  /** Restores alpha-shaped foreground over an exact, otherwise untouched surface. */
  private blendWithSurface(
    enhancedRgb: Uint8Array,
    source: Uint8ClampedArray,
    background: readonly [number, number, number],
  ): Uint8ClampedArray {
    const result = new Uint8ClampedArray(source.length);
    for (let pixel = 0; pixel < source.length / 4; pixel++) {
      const sourceIndex = pixel * 4;
      const enhancedIndex = pixel * 3;
      const alpha = source[sourceIndex + 3] / 255;
      result[sourceIndex] = Math.round(
        enhancedRgb[enhancedIndex] * alpha + background[0] * (1 - alpha),
      );
      result[sourceIndex + 1] = Math.round(
        enhancedRgb[enhancedIndex + 1] * alpha + background[1] * (1 - alpha),
      );
      result[sourceIndex + 2] = Math.round(
        enhancedRgb[enhancedIndex + 2] * alpha + background[2] * (1 - alpha),
      );
      result[sourceIndex + 3] = 255;
    }
    return result;
  }

  /** Computes an alpha-weighted mean WCAG contrast ratio against the card. */
  private scoreContrast(
    pixels: Uint8ClampedArray,
    source: Uint8ClampedArray,
    background: readonly [number, number, number],
  ): number {
    const backgroundLuminance = relativeLuminance(...background);
    let weightedContrast = 0;
    let totalAlpha = 0;

    for (let index = 0; index < pixels.length; index += 4) {
      const alpha = source[index + 3] / 255;
      if (alpha === 0) {
        continue;
      }
      const foregroundLuminance = relativeLuminance(
        pixels[index],
        pixels[index + 1],
        pixels[index + 2],
      );
      const contrast =
        (Math.max(backgroundLuminance, foregroundLuminance) + 0.05) /
        (Math.min(backgroundLuminance, foregroundLuminance) + 0.05);
      weightedContrast += contrast * alpha;
      totalAlpha += alpha;
    }

    return totalAlpha === 0 ? 1 : weightedContrast / totalAlpha;
  }
}
