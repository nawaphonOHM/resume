import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject, Service } from '@angular/core';

import type { OpenCvRuntime } from '../../../../../helper/interface/open-cv-runtime/open-cv-runtime.interface.ts';
import { OPEN_CV_RETRY_COUNT } from '../../../../../helper/injection-token/open-cv-retry-count.variable.ts';
import { OPEN_CV_CDN_URL } from '../../../../../helper/injection-token/open-cv-cdn-url.variable.ts';
import { TECHNOLOGY_ICON_OPEN_CV_LOADER } from '../../../../../helper/injection-token/technology-icon-open-cv-loader.function.ts';
import type { TechnologyIconPresentation } from '../../../../../helper/interface/technology-icon-presentation/technology-icon-presentation.interface.ts';
import { LightSurface } from '../../../../../helper/interface/card-surface/light-surface/light-surface.ts';
import { IDLE_TIMEOUT_MS } from '../../../../../helper/injection-token/idle-timeout-ms.variable.ts';
import { normalizeOpenCvExport } from '../../../../../helper/injection-token/normalize-open-cv-export.function.ts';
import { OPEN_CV_RETRY_DELAY_MS } from '../../../../../helper/injection-token/open-cv-retry-delay-ms.variable.ts';
import { OPEN_CV_RETRY_DELAY_MULTIPLIER } from '../../../../../helper/injection-token/open-cv-retry-delay-multiplier.variable.ts';
import { OPEN_CV_RETRY_JITTER_MS } from '../../../../../helper/injection-token/open-cv-retry-jitter-ms.variable.ts';
import type { RasterizedIcon } from '../../../../../helper/interface/rasterized-icon/rasterized-icon.interface.ts';
import type { CardSurface } from '../../../../../helper/interface/card-surface/card-surface.interface.ts';
import type { Candidate } from '../../../../../helper/interface/candidate/candidate.interface.ts';
import { DarkSurface } from '../../../../../helper/interface/card-surface/dark-surface/dark-surface.ts';
import type { OpenCvMat } from '../../../../../helper/interface/disposable/deletable/open-cv-mat/open-cv-mat.interface.ts';
import type { OpenCvMatVector } from '../../../../../helper/interface/disposable/deletable/open-cv-mat-vector/open-cv-mat-vector.interface.ts';
import type { OpenCvSize } from '../../../../../helper/interface/disposable/open-cv-size/open-cv-size.interface.ts';
import type { OpenCvClahe } from '../../../../../helper/interface/disposable/deletable/open-cv-clahe/open-cv-clahe.interface.ts';
import { CLAHE_CLIP_LIMIT } from '../../../../../helper/injection-token/clahe-clip-limit.variable.ts';
import { dispose } from '../../../../../helper/injection-token/dispose.function.ts';
import { MIN_CLAHE_TILES } from '../../../../../helper/injection-token/min-clahe-tiles.variable.ts';
import { MAX_CLAHE_TILES } from '../../../../../helper/injection-token/max-clahe-titles.variable.ts';
import { CLAHE_TILE_PIXEL_TARGET } from '../../../../../helper/injection-token/clahe-tile-pixel-target.variable.ts';
import { relativeLuminance } from '../../../../../helper/injection-token/relative-luminance.function.ts';
import type { TechnologyIconMetadata } from '../../../../../helper/interface/brand-logo/technology-icon-meta-data/technology-icon-meta-data.interface.ts';

/**
 * Lazily rasterizes and contrast-optimizes brand SVG artwork using OpenCV WebAssembly,
 * CIE Lab color space transformation, and Contrast Limited Adaptive Histogram Equalization (CLAHE).
 *
 * ### Architectural Pipeline
 * ```
 * Raw SVG Metadata (icon: { src, width, height })
 *         │
 *         ▼
 *    waitForIdle() ──► Schedule during browser idle time via requestIdleCallback
 *         │
 *         ▼
 *   loadOpenCv() ──► Asynchronously download & compile OpenCV WebAssembly from CDN
 *         │
 *         ▼
 *    rasterize() ──► Render SVG into 2D canvas with { willReadFrequently: true }
 *         │
 *         ├──► evaluateCandidate(LightSurface)
 *         │       ├── 1. composite(): Alpha blend original SVG over light card RGB
 *         │       ├── 2. applyClahe(): RGBA -> RGB -> CIE Lab -> CLAHE on L* -> RGB
 *         │       ├── 3. blendWithSurface(): Re-blend enhanced RGB with source alpha
 *         │       └── 4. scoreContrast(): Alpha-weighted WCAG 2.1 contrast scoring
 *         │
 *         └──► evaluateCandidate(DarkSurface)
 *                 ├── 1. composite(): Alpha blend original SVG over dark card RGB
 *                 ├── 2. applyClahe(): RGBA -> RGB -> CIE Lab -> CLAHE on L* -> RGB
 *                 ├── 3. blendWithSurface(): Re-blend enhanced RGB with source alpha
 *                 └── 4. scoreContrast(): Alpha-weighted WCAG 2.1 contrast scoring
 *         │
 *         ▼
 *   Winner Selection: Choose surface and pixel buffer with highest WCAG contrast score
 *         │
 *         ▼
 *   Serialize: Export winner canvas to PNG Data URL and memoize in presentations Map
 * ```
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
  private readonly claheClipLimit = inject(CLAHE_CLIP_LIMIT);
  private readonly dispose = inject(dispose);
  private readonly minClaheTiles = inject(MIN_CLAHE_TILES);
  private readonly maxClaheTiles = inject(MAX_CLAHE_TILES);
  private readonly claheTilePixelTarget = inject(CLAHE_TILE_PIXEL_TARGET);
  private readonly relativeLuminance = inject(relativeLuminance);

  /**
   * Returns cached optimized artwork, resolving safely to the original SVG and
   * light card whenever browser, image, canvas, or OpenCV processing fails.
   *
   * @param icon Metadata containing source URL and dimensions of the icon.
   * @returns A Promise resolving to the optimal presentation configuration.
   */
  optimize(icon: TechnologyIconMetadata): Promise<TechnologyIconPresentation> {
    // Null byte separator prevents ambiguity across variable-length URL strings and dimensions
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

  /**
   * Preserves the original usable SVG and default light frame when enhancement
   * is unavailable (e.g., SSR, network error, or WebAssembly failure).
   */
  private createFallback(icon: TechnologyIconMetadata): TechnologyIconPresentation {
    return { logo: icon, backgroundColor: this.lightSurface.backgroundColor };
  }

  /**
   * Schedules heavy runtime download, compilation, and canvas image processing
   * during browser idle periods to prevent main-thread UI jank during initial render.
   */
  private waitForIdle(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.view?.requestIdleCallback) {
        this.view.requestIdleCallback(() => resolve(), { timeout: this.idealTimeout });
      } else {
        this.view?.setTimeout(resolve, 0);
      }
    });
  }

  /**
   * Memoizes and returns the singleton OpenCV WebAssembly initialization Promise,
   * guaranteeing that Wasm binary fetching and compilation occur at most once.
   */
  private loadOpenCv(): Promise<OpenCvRuntime> {
    this.openCvRuntime ??= this.initializeOpenCv();
    return this.openCvRuntime;
  }

  /**
   * Retries CDN loading and runtime normalization with exponential backoff and
   * deterministic cache-busting query URLs to bypass poisoned intermediate caches.
   */
  private async initializeOpenCv(): Promise<OpenCvRuntime> {
    let finalError: unknown;

    for (let retry = 0; retry <= this.openCvRetryCount; retry++) {
      if (retry > 0) {
        await this.waitForOpenCvRetry(retry);
      }

      // Append retry query parameter to bypass poisoned CDN or proxy caches on network failure
      const sourceUrl = retry === 0 ? this.openCvCdnUrl : `${this.openCvCdnUrl}?retry=${retry}`;
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

  /**
   * Calculates retry backoff delay using the exponential backoff formula:
   * $$\text{delay} = \text{base} \cdot \text{multiplier}^{\text{retry}-1} + \text{jitter}$$
   *
   * @param retry The 1-based retry attempt index.
   */
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

  /**
   * Executes the end-to-end computer vision enhancement pipeline: validates dimensions,
   * loads the WebAssembly runtime, rasterizes the SVG, evaluates contrast on candidate
   * surfaces, selects the optimal presentation, and serializes the result to a PNG data URL.
   *
   * @param icon Metadata containing image source URL and dimensions.
   * @returns A Promise resolving to the selected presentation and surface styling.
   */
  private async enhance(icon: TechnologyIconMetadata): Promise<TechnologyIconPresentation> {
    if (
      !Number.isInteger(icon.width) ||
      !Number.isInteger(icon.height) ||
      icon.width <= 0 ||
      icon.height <= 0
    ) {
      throw new Error('Technology icon dimensions must be positive integers');
    }

    // Step 1: Ensure OpenCV WebAssembly runtime is loaded and ready
    const cv = await this.loadOpenCv();

    // Step 2: Rasterize remote SVG into raw RGBA pixel buffer on a 2D canvas
    const rasterized = await this.rasterize(icon);

    // Step 3: Evaluate contrast enhancement independently on light and dark surfaces
    const candidates = [this.lightSurface, this.darkSurface].map((surface) =>
      this.evaluateCandidate(cv, rasterized.context, rasterized.pixels, icon, surface),
    );

    // Step 4: Pick the surface/pixel candidate that maximizes the alpha-weighted WCAG contrast score
    const winner = candidates[1].score > candidates[0].score ? candidates[1] : candidates[0];

    // Step 5: Draw the winning pixel buffer back onto the canvas and serialize as PNG data URL
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

  /**
   * Asynchronously loads and decodes the SVG image via `HTMLImageElement`, draws it onto
   * an `HTMLCanvasElement` configured with `{ willReadFrequently: true }`, and extracts
   * the raw 4-channel `Uint8ClampedArray` RGBA pixel buffer.
   *
   * @param icon Metadata containing source URL and dimensions.
   * @returns The canvas, rendering context, and raw RGBA pixel buffer.
   */
  private async rasterize(icon: TechnologyIconMetadata): Promise<RasterizedIcon> {
    if (!this.view) {
      throw new Error('Technology icon rasterization requires a browser');
    }

    // Load and decode SVG asynchronously without blocking UI
    const image = new this.view.Image();
    image.decoding = 'async';
    image.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Technology icon could not be loaded'));
      image.src = icon.src;
    });

    // Create 2D canvas optimized for repeated CPU readbacks
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

  /**
   * Compares the untouched SVG composite against a CLAHE-enhanced candidate on a given
   * card surface, returning the version that yields the higher alpha-weighted WCAG contrast.
   *
   * ### Evaluation Workflow
   * 1. Composite original SVG pixels over card surface background.
   * 2. Apply CLAHE enhancement in CIE Lab color space to improve local luminance contrast.
   * 3. Re-blend enhanced RGB pixels with original alpha mask over card surface background.
   * 4. Score WCAG 2.1 contrast ratios for both buffers; select candidate with higher score.
   */
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

  /**
   * Composites non-opaque SVG pixels over an opaque background color using standard
   * alpha blending:
   *
   * $$C_{\text{out}} = \text{round}(C_{\text{src}} \cdot \alpha + C_{\text{bg}} \cdot (1 - \alpha))$$
   * $$\alpha_{\text{out}} = 255$$
   *
   * @param source Raw 4-channel RGBA pixel buffer of the icon.
   * @param background Opaque [R, G, B] background color tuple [0..255].
   * @returns Fully opaque 4-channel RGBA composite buffer.
   */
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

  /**
   * Enhances image contrast by applying Contrast Limited Adaptive Histogram Equalization
   * (CLAHE) to the isolated $L^*$ luminance channel in CIE $L^*a^*b^*$ color space.
   *
   * ### Color Science & Image Processing Steps
   * 1. **Color Space Transformation (RGBA -> RGB -> CIE Lab):**
   *    Converts pixels to CIE $L^*a^*b^*$ space where perceptual luminance ($L^*$) is completely
   *    decoupled from chromaticity ($a^*, b^*$).
   * 2. **Channel Splitting:**
   *    Separates $L^*$ (lightness) from $a^*$ (green-red) and $b^*$ (blue-yellow).
   * 3. **Adaptive CLAHE Equalization:**
   *    Applies CLAHE on $L^*$ across an adaptive grid ($\text{tileCount}(w) \times \text{tileCount}(h)$).
   *    Histogram slope is clipped at `claheClipLimit` to prevent noise amplification in uniform regions.
   * 4. **Channel Recombination & Inverse Conversion (CIE Lab -> RGB):**
   *    Merges equalized $L^*$ with original $a^*$ and $b^*$ chromaticity channels and transforms back
   *    to RGB, ensuring original brand colors/hues are preserved with enhanced luminance contrast.
   * 5. **WebAssembly Memory Deallocation:**
   *    Explicitly invokes `dispose()` on all 13 allocated OpenCV C++ objects in `finally` block to
   *    prevent memory leaks in the Emscripten linear memory heap.
   *
   * @param cv OpenCV WebAssembly runtime instance.
   * @param context 2D Canvas rendering context for image data creation.
   * @param pixels 4-channel RGBA composited pixel buffer.
   * @param width Width of the image in pixels.
   * @param height Height of the image in pixels.
   * @returns 3-channel RGB `Uint8Array` of enhanced pixels.
   */
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
      // Wrap raw canvas pixel buffer into OpenCV RGBA Mat
      const imageData = context.createImageData(width, height);
      imageData.data.set(pixels);
      rgba = cv.matFromImageData(imageData);
      rgb = new cv.Mat();
      lab = new cv.Mat();

      // Convert RGBA -> RGB -> CIE Lab
      cv.cvtColor(rgba, rgb, cv.COLOR_RGBA2RGB);
      cv.cvtColor(rgb, lab, cv.COLOR_RGB2Lab);

      // Split CIE Lab into individual L*, a*, and b* channels
      channels = new cv.MatVector();
      cv.split(lab, channels);
      luminance = channels.get(0); // L* channel (perceptual lightness)
      firstChroma = channels.get(1); // a* channel (green - red)
      secondChroma = channels.get(2); // b* channel (blue - yellow)

      // Initialize CLAHE with adaptive tile grid dimensions
      enhancedLuminance = new cv.Mat();
      tileGrid = new cv.Size(this.tileCount(width), this.tileCount(height));
      clahe = new cv.CLAHE(this.claheClipLimit, tileGrid);

      // Equalize luminance channel
      clahe.apply(luminance, enhancedLuminance);

      // Recombine enhanced L* with untouched original chromaticity channels
      enhancedChannels = new cv.MatVector();
      enhancedChannels.push_back(enhancedLuminance);
      enhancedChannels.push_back(firstChroma);
      enhancedChannels.push_back(secondChroma);
      enhancedLab = new cv.Mat();
      cv.merge(enhancedChannels, enhancedLab);

      // Convert enhanced CIE Lab back to standard RGB
      enhancedRgb = new cv.Mat();
      cv.cvtColor(enhancedLab, enhancedRgb, cv.COLOR_Lab2RGB);

      const result = Uint8Array.from(enhancedRgb.data);
      if (result.length !== width * height * 3) {
        throw new Error('OpenCV returned invalid enhanced pixels');
      }
      return result;
    } finally {
      // Explicitly deallocate WebAssembly C++ heap allocations
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

  /**
   * Calculates the adaptive CLAHE tile count along a single spatial dimension:
   *
   * $$\text{tiles} = \max\left(\text{minTiles}, \min\left(\text{maxTiles}, \left\lceil \frac{\text{dimension}}{\text{pixelTarget}} \right\rceil\right)\right)$$
   *
   * @param dimension Width or height in pixels.
   * @returns Number of contextual grid tiles for CLAHE.
   */
  private tileCount(dimension: number): number {
    return Math.max(
      this.minClaheTiles,
      Math.min(this.maxClaheTiles, Math.ceil(dimension / this.claheTilePixelTarget)),
    );
  }

  /**
   * Restores the alpha-masked foreground by blending enhanced 3-channel RGB pixels with
   * the original source alpha channel over the card background:
   *
   * $$C_{\text{out}} = \text{round}(C_{\text{enh}} \cdot \alpha + C_{\text{bg}} \cdot (1 - \alpha))$$
   *
   * @param enhancedRgb 3-channel RGB enhanced pixel array.
   * @param source Original 4-channel RGBA pixel array (provides alpha mask).
   * @param background Opaque [R, G, B] background color tuple.
   * @returns 4-channel RGBA blended pixel buffer.
   */
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

  /**
   * Computes an alpha-weighted mean WCAG 2.1 contrast ratio of the candidate image
   * against the card surface background color:
   *
   * $$\text{Score} = \frac{\sum_{i \in \text{opaque pixels}} \left( \text{Contrast}(L_{\text{fg}, i}, L_{\text{bg}}) \cdot \alpha_i \right)}{\sum_{i \in \text{opaque pixels}} \alpha_i}$$
   *
   * where:
   * $$\text{Contrast}(L_1, L_2) = \frac{\max(L_1, L_2) + 0.05}{\min(L_1, L_2) + 0.05}$$
   *
   * @param pixels Candidate 4-channel RGBA pixel buffer.
   * @param source Original 4-channel RGBA pixel buffer (provides alpha weights).
   * @param background Opaque [R, G, B] background color tuple.
   * @returns Alpha-weighted mean contrast ratio ($\ge 1.0$).
   */
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
