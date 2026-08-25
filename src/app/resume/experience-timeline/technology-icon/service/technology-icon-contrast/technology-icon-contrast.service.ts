import {DOCUMENT, isPlatformBrowser} from '@angular/common';
import {PLATFORM_ID, inject, Service} from '@angular/core';

import type {TechnologyIconMetadata} from '../../technology-icons.ts';
import type {OpenCvRuntime} from '../../../../../helper/interface/open-cv-runtime/open-cv-runtime.interface.ts';
import {OPEN_CV_RETRY_COUNT} from '../../../../../helper/injection-token/open-cv-retry-count.variable.ts';
import {OPEN_CV_CDN_URL} from '../../../../../helper/injection-token/open-cv-cdn-url.variable.ts';
import {
  TECHNOLOGY_ICON_OPEN_CV_LOADER
} from '../../../../../helper/injection-token/technology-icon-open-cv-loader.function.ts';
import type {
  TechnologyIconPresentation
} from '../../../../../helper/interface/technology-icon-presentation/technology-icon-presentation.interface.ts';
import {LightSurface} from '../../../../../helper/interface/card-surface/light-surface/light-surface.ts';
import {IDLE_TIMEOUT_MS} from '../../../../../helper/injection-token/idle-timeout-ms.variable.ts';
import {normalizeOpenCvExport} from '../../../../../helper/injection-token/normalize-open-cv-export.function.ts';
import {OPEN_CV_RETRY_DELAY_MS} from '../../../../../helper/injection-token/open-cv-retry-delay-ms.variable.ts';
import {
  OPEN_CV_RETRY_DELAY_MULTIPLIER
} from '../../../../../helper/injection-token/open-cv-retry-delay-multiplier.variable.ts';
import {OPEN_CV_RETRY_JITTER_MS} from '../../../../../helper/injection-token/open-cv-retry-jitter-ms.variable.ts';
import type {RasterizedIcon} from '../../../../../helper/interface/rasterized-icon/rasterized-icon.interface.ts';
import type {CardSurface} from '../../../../../helper/interface/card-surface/card-surface.interface.ts';
import type {Candidate} from '../../../../../helper/interface/candidate/candidate.interface.ts';
import {DarkSurface} from '../../../../../helper/interface/card-surface/dark-surface/dark-surface.ts';
import type {
  OpenCvMat
} from '../../../../../helper/interface/disposable/deletable/open-cv-mat/open-cv-mat.interface.ts';
import type {
  OpenCvMatVector
} from '../../../../../helper/interface/disposable/deletable/open-cv-mat-vector/open-cv-mat-vector.interface.ts';
import type {OpenCvSize} from '../../../../../helper/interface/disposable/open-cv-size/open-cv-size.interface.ts';
import type {
  OpenCvClahe
} from '../../../../../helper/interface/disposable/deletable/open-cv-clahe/open-cv-clahe.interface.ts';
import {CLAHE_CLIP_LIMIT} from '../../../../../helper/injection-token/clahe-clip-limit.variable.ts';
import {dispose} from '../../../../../helper/injection-token/dispose.function.ts';
import {MIN_CLAHE_TILES} from '../../../../../helper/injection-token/min-clahe-tiles.variable.ts';
import {MAX_CLAHE_TILES} from '../../../../../helper/injection-token/max-clahe-titles.variable.ts';
import {CLAHE_TILE_PIXEL_TARGET} from '../../../../../helper/injection-token/clahe-tile-pixel-target.variable.ts';
import { relativeLuminance } from "../../../../../helper/injection-token/relative-luminance.function.ts";

/**
 * Lazily rasterizes and contrast-optimizes technology artwork once per unique
 * source and intrinsic size for the lifetime of the root service.
 */
@Service()
export class TechnologyIconContrastService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly openCvLoader = inject(TECHNOLOGY_ICON_OPEN_CV_LOADER);
  private readonly view = isPlatformBrowser(this.platformId) ? this.document.defaultView : null;
  private readonly presentations = new Map<string, Promise<TechnologyIconPresentation>>();
  private openCvRuntime: Promise<OpenCvRuntime> | undefined;
  private readonly openCvCdnUrl = inject(OPEN_CV_CDN_URL);
  private readonly lightSurface = inject(LightSurface);
  private readonly darkSurface = inject(DarkSurface);
  private readonly idealTimeout = inject(IDLE_TIMEOUT_MS);
  private readonly openCvRetryCount = inject(OPEN_CV_RETRY_COUNT);
  private readonly normalizeOpenCvExport = inject(normalizeOpenCvExport);
  private readonly openCvRetryDelayMs = inject(OPEN_CV_RETRY_DELAY_MS);
  private readonly openCvRetryDelayMultiplier = inject(OPEN_CV_RETRY_DELAY_MULTIPLIER);
  private readonly openCvRetryJitterMs = inject(OPEN_CV_RETRY_JITTER_MS);
  private readonly claheClipLimit = inject(CLAHE_CLIP_LIMIT)
  private readonly dispose = inject(dispose);
  private readonly minClaheTiles = inject(MIN_CLAHE_TILES)
  private readonly maxClaheTiles = inject(MAX_CLAHE_TILES)
  private readonly claheTilePixelTarget = inject(CLAHE_TILE_PIXEL_TARGET)
  private readonly relativeLuminance = inject(relativeLuminance)

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
    return {logo: icon, backgroundColor: this.lightSurface.backgroundColor};
  }

  /** Schedules heavy runtime and canvas work after the initial render. */
  private waitForIdle(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.view?.requestIdleCallback) {
        this.view.requestIdleCallback(() => resolve(), {timeout: this.idealTimeout});
      } else {
        this.view?.setTimeout(resolve, 0);
      }
    });
  }

  /** Loads and initializes the complete retry sequence once after idle work begins. */
  private loadOpenCv(): Promise<OpenCvRuntime> {
    this.openCvRuntime ??= this.initializeOpenCv();
    return this.openCvRuntime;
  }

  /** Retries CDN loading and runtime normalization with deterministic source URLs. */
  private async initializeOpenCv(): Promise<OpenCvRuntime> {
    let finalError: unknown;

    for (let retry = 0; retry <= this.openCvRetryCount; retry++) {
      if (retry > 0) {
        await this.waitForOpenCvRetry(retry);
      }

      const sourceUrl = retry === 0 ? this.openCvCdnUrl : `${(this.openCvCdnUrl)}?retry=${retry}`;
      try {
        const moduleValue = await this.openCvLoader(sourceUrl);
        return await this.normalizeOpenCvExport(moduleValue);
      } catch (error) {
        finalError = error;
      }
    }

    const exhaustedError = finalError ?? new Error('OpenCV initialization failed');
    this.view?.console.warn(
      `OpenCV initialization failed after ${this.openCvRetryCount + 1} attempts; using original technology icons.`,
      exhaustedError,
    );
    throw exhaustedError;
  }

  /** Waits for the fixed retry delay without introducing jitter or server work. */
  private waitForOpenCvRetry(retry: number): Promise<void> {
    const view = this.view;
    if (!view) {
      return Promise.resolve();
    }

    const delay =
      this.openCvRetryDelayMs * this.openCvRetryDelayMultiplier ** (retry - 1) +
      this.openCvRetryJitterMs;
    return new Promise<void>((resolve) => view.setTimeout(resolve, delay));
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
    const candidates = [this.darkSurface, this.lightSurface].map((surface) =>
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

  /** Loads the remote SVG and retains its untouched alpha mask as RGBA pixels. */
  private async rasterize(icon: TechnologyIconMetadata): Promise<RasterizedIcon> {
    if (!this.view) {
      throw new Error('Technology icon rasterization requires a browser');
    }

    const image = new this.view.Image();
    image.decoding = 'async';
    image.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Technology icon could not be loaded'));
      image.src = icon.src;
    });

    const canvas = this.document.createElement('canvas');
    canvas.width = icon.width;
    canvas.height = icon.height;
    const context = canvas.getContext('2d', {willReadFrequently: true});
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
      ? {pixels: enhanced, score: enhancedScore, surface}
      : {pixels: original, score: originalScore, surface};
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
      clahe = new cv.CLAHE(this.claheClipLimit, tileGrid);
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
      this.dispose(enhancedRgb);
      this.dispose(enhancedLab);
      this.dispose(enhancedChannels);
      this.dispose(clahe);
      this.dispose(tileGrid);
      this.dispose(enhancedLuminance);
      this.dispose(secondChroma);
      this.dispose(firstChroma);
      this.dispose(luminance);
      this.dispose(channels);
      this.dispose(lab);
      this.dispose(rgb);
      this.dispose(rgba);
    }
  }

  /** Chooses an adaptive tile count independently for each intrinsic dimension. */
  private tileCount(dimension: number): number {
    return Math.max(
      this.minClaheTiles,
      Math.min(this.maxClaheTiles, Math.ceil(dimension / this.claheTilePixelTarget)),
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
    const backgroundLuminance = this.relativeLuminance(...background);
    let weightedContrast = 0;
    let totalAlpha = 0;

    for (let index = 0; index < pixels.length; index += 4) {
      const alpha = source[index + 3] / 255;
      if (alpha === 0) {
        continue;
      }
      const foregroundLuminance = this.relativeLuminance(
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
