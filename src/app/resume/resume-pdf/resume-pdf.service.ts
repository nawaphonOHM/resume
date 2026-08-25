import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {Injectable, InjectionToken, PLATFORM_ID, inject, Service} from '@angular/core';

import { RESUME } from '../../data/resume/resume.data';
import {
  buildResumeDocumentDefinition,
  validateResumePdfBytes,
  type ResumePdfDocumentDefinition,
} from './resume-pdf-document';

export const RESUME_PDF_FILENAME = 'nawaphon-isarathanachaikul-resume-profile.pdf';

/** Generated document handle exposed by the browser pdfmake runtime. */
export interface ResumePdfGenerator {
  getBuffer(): Promise<unknown>;
}

/** Minimal pdfmake API used to generate the résumé in the browser. */
export interface ResumePdfRuntime {
  createPdf(definition: ResumePdfDocumentDefinition): ResumePdfGenerator;
}

/** Deferred browser-runtime loader, replaceable at the lazy boundary in tests. */
export type ResumePdfRuntimeLoader = () => Promise<ResumePdfRuntime>;

/** Immutable external script descriptor used by the pdfmake CDN boundary. */
export interface ResumePdfCdnAsset {
  readonly url: string;
  readonly integrity: string;
}

/** Browser script loader that shares exact-URL loads and can evict stale assets. */
export interface ResumePdfCdnScriptLoader {
  load(asset: ResumePdfCdnAsset): Promise<void>;
  invalidate(asset: ResumePdfCdnAsset): void;
}

interface BrowserResumePdfRuntime extends ResumePdfRuntime {
  readonly virtualfs?: {
    readonly storage?: Readonly<Record<string, unknown>>;
  };
  addVirtualFileSystem(virtualFileSystem: Readonly<Record<string, unknown>>): void;
}

interface ResumePdfCdnScriptEntry {
  readonly element: HTMLScriptElement;
  readonly promise: Promise<void>;
  discard(error?: Error): void;
}

type PdfMakeWindow = Window & typeof globalThis & { pdfMake?: unknown };

const PDFMAKE_CORE_ASSET = {
  url: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.3.3/pdfmake.min.js',
  integrity:
    'sha512-EkS5jkn3vXRWIdphIy51xskMZggNip3Or8kpe/FlM5XaQeiK2GZJ9OwrIEbXl6txKWsHNtm4OXtxzkkz41Mspw==',
} as const satisfies ResumePdfCdnAsset;

const PDFMAKE_FONT_ASSET = {
  url: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.3.3/vfs_fonts.min.js',
  integrity:
    'sha512-rpvsrDF7BNgiFOXqkKyyoJ46jZ8nwQ3NJJAmpYnYKuZHfzwR2wpz5cAaPX09RCj9un5E+ErATIqy4CZBcuNogA==',
} as const satisfies ResumePdfCdnAsset;

const REQUIRED_ROBOTO_FONTS = [
  'Roboto-Regular.ttf',
  'Roboto-Medium.ttf',
  'Roboto-Italic.ttf',
  'Roboto-MediumItalic.ttf',
] as const;

function normalizePdfMake(pdfMake: unknown): BrowserResumePdfRuntime {
  if (
    !pdfMake ||
    (typeof pdfMake !== 'object' && typeof pdfMake !== 'function') ||
    typeof (pdfMake as Partial<BrowserResumePdfRuntime>).createPdf !== 'function' ||
    typeof (pdfMake as Partial<BrowserResumePdfRuntime>).addVirtualFileSystem !== 'function'
  ) {
    throw new Error('The pdfmake browser runtime is unavailable.');
  }
  return pdfMake as BrowserResumePdfRuntime;
}

function hasRequiredRobotoFonts(runtime: BrowserResumePdfRuntime): boolean {
  const storage = runtime.virtualfs?.storage;
  return (
    !!storage &&
    typeof storage === 'object' &&
    !Array.isArray(storage) &&
    REQUIRED_ROBOTO_FONTS.every(
      (font) => Object.prototype.hasOwnProperty.call(storage, font) && storage[font] != null,
    )
  );
}

function clearRequiredRobotoFonts(runtime: BrowserResumePdfRuntime): void {
  const storage = runtime.virtualfs?.storage;
  if (!storage || typeof storage !== 'object' || Array.isArray(storage)) {
    return;
  }
  for (const font of REQUIRED_ROBOTO_FONTS) {
    Reflect.deleteProperty(storage, font);
  }
}

function clearPdfMake(view: PdfMakeWindow): void {
  try {
    if (!Reflect.deleteProperty(view, 'pdfMake')) {
      view.pdfMake = undefined;
    }
  } catch {
    try {
      view.pdfMake = undefined;
    } catch {
      // A hostile pre-existing global may be neither configurable nor writable.
    }
  }
}

function createCdnScriptLoader(document: Document, platformId: object): ResumePdfCdnScriptLoader {
  const view = isPlatformBrowser(platformId) ? document.defaultView : null;
  const entries = new Map<string, ResumePdfCdnScriptEntry>();

  return {
    load(asset: ResumePdfCdnAsset): Promise<void> {
      const cached = entries.get(asset.url);
      if (cached) {
        return cached.promise;
      }
      if (!view) {
        return Promise.reject(new Error('The pdfmake CDN scripts require a browser.'));
      }

      const element = document.createElement('script');
      element.src = asset.url;
      element.integrity = asset.integrity;
      element.crossOrigin = 'anonymous';
      element.referrerPolicy = 'no-referrer';
      element.async = true;

      let resolveLoad!: () => void;
      let rejectLoad!: (error: Error) => void;
      let settled = false;
      const promise = new Promise<void>((resolve, reject) => {
        resolveLoad = resolve;
        rejectLoad = reject;
      });
      let entry!: ResumePdfCdnScriptEntry;

      const removeListeners = (): void => {
        element.removeEventListener('load', handleLoad);
        element.removeEventListener('error', handleError);
      };
      const handleLoad = (): void => {
        if (settled) {
          return;
        }
        settled = true;
        removeListeners();
        resolveLoad();
      };
      const handleError = (): void => {
        entry.discard(new Error(`Unable to load the pdfmake CDN script: ${asset.url}`));
      };

      entry = {
        element,
        promise,
        discard(error = new Error(`The pdfmake CDN script was invalidated: ${asset.url}`)): void {
          removeListeners();
          if (entries.get(asset.url) === entry) {
            entries.delete(asset.url);
          }
          element.remove();
          if (!settled) {
            settled = true;
            rejectLoad(error);
          }
        },
      };

      element.addEventListener('load', handleLoad);
      element.addEventListener('error', handleError);
      entries.set(asset.url, entry);
      try {
        document.head.append(element);
      } catch (error: unknown) {
        entry.discard(
          error instanceof Error
            ? error
            : new Error(`Unable to append the pdfmake CDN script: ${asset.url}`),
        );
      }
      return promise;
    },

    invalidate(asset: ResumePdfCdnAsset): void {
      entries.get(asset.url)?.discard();
    },
  };
}

/** Integrity-checked DOM loader shared by the production runtime and replaceable in tests. */
export const RESUME_PDF_CDN_SCRIPT_LOADER = new InjectionToken<ResumePdfCdnScriptLoader>(
  'RESUME_PDF_CDN_SCRIPT_LOADER',
  {
    providedIn: 'root',
    factory: () => createCdnScriptLoader(inject(DOCUMENT), inject(PLATFORM_ID)),
  },
);

async function loadBrowserPdfRuntime(
  view: PdfMakeWindow,
  scriptLoader: ResumePdfCdnScriptLoader,
): Promise<ResumePdfRuntime> {
  try {
    await scriptLoader.load(PDFMAKE_CORE_ASSET);
  } catch (error: unknown) {
    scriptLoader.invalidate(PDFMAKE_CORE_ASSET);
    clearPdfMake(view);
    throw error;
  }

  let runtime: BrowserResumePdfRuntime;
  try {
    runtime = normalizePdfMake(view.pdfMake);
  } catch (error: unknown) {
    scriptLoader.invalidate(PDFMAKE_CORE_ASSET);
    clearPdfMake(view);
    throw error;
  }

  try {
    await scriptLoader.load(PDFMAKE_FONT_ASSET);
  } catch (error: unknown) {
    scriptLoader.invalidate(PDFMAKE_FONT_ASSET);
    clearRequiredRobotoFonts(runtime);
    throw error;
  }

  let registeredRuntime: BrowserResumePdfRuntime;
  try {
    registeredRuntime = normalizePdfMake(view.pdfMake);
  } catch (error: unknown) {
    scriptLoader.invalidate(PDFMAKE_FONT_ASSET);
    scriptLoader.invalidate(PDFMAKE_CORE_ASSET);
    clearPdfMake(view);
    throw error;
  }

  if (registeredRuntime !== runtime) {
    scriptLoader.invalidate(PDFMAKE_FONT_ASSET);
    scriptLoader.invalidate(PDFMAKE_CORE_ASSET);
    clearPdfMake(view);
    throw new Error('The pdfmake browser runtime is unavailable.');
  }
  if (!hasRequiredRobotoFonts(runtime)) {
    scriptLoader.invalidate(PDFMAKE_FONT_ASSET);
    clearRequiredRobotoFonts(runtime);
    throw new Error('The pdfmake browser font bundle is unavailable.');
  }

  return runtime;
}

/**
 * Loader whose factory stays inert until an explicit download requests the
 * integrity-checked browser scripts.
 */
export const RESUME_PDF_RUNTIME_LOADER = new InjectionToken<ResumePdfRuntimeLoader>(
  'RESUME_PDF_RUNTIME_LOADER',
  {
    providedIn: 'root',
    factory: () => {
      const document = inject(DOCUMENT);
      const platformId = inject(PLATFORM_ID);
      const scriptLoader = inject(RESUME_PDF_CDN_SCRIPT_LOADER);
      const view = isPlatformBrowser(platformId)
        ? (document.defaultView as PdfMakeWindow | null)
        : null;
      return () => {
        if (!view) {
          return Promise.reject(new Error('The pdfmake browser runtime is unavailable.'));
        }
        return loadBrowserPdfRuntime(view, scriptLoader);
      };
    },
  },
);

/** Lazily generates, validates, and downloads the canonical résumé PDF. */
@Service()
export default class ResumePdfService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly runtimeLoader = inject(RESUME_PDF_RUNTIME_LOADER);
  private readonly view = isPlatformBrowser(this.platformId) ? this.document.defaultView : null;
  private runtime: Promise<ResumePdfRuntime> | undefined;

  /** Generates one PDF only after a browser caller explicitly requests it. */
  async download(): Promise<void> {
    const view = this.view;
    if (!view) {
      return;
    }

    const definition = buildResumeDocumentDefinition(RESUME);
    const runtime = await this.loadRuntime();
    const pdf = await runtime.createPdf(definition).getBuffer();
    validateResumePdfBytes(pdf, RESUME);

    const blob = new view.Blob([pdf as BlobPart], { type: 'application/pdf' });
    this.downloadBlob(view, blob);
  }

  /** Shares successful and in-flight loading while allowing failed loads to retry. */
  private loadRuntime(): Promise<ResumePdfRuntime> {
    this.runtime ??= this.runtimeLoader().catch((error: unknown) => {
      this.runtime = undefined;
      throw error;
    });
    return this.runtime;
  }

  /** Activates one temporary anchor and releases every browser resource afterward. */
  private downloadBlob(view: Window & typeof globalThis, blob: Blob): void {
    const objectUrl = view.URL.createObjectURL(blob);
    let anchor: HTMLAnchorElement | undefined;

    try {
      anchor = this.document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = RESUME_PDF_FILENAME;
      anchor.hidden = true;
      this.document.body.append(anchor);
      anchor.click();
    } finally {
      anchor?.remove();
      view.URL.revokeObjectURL(objectUrl);
    }
  }
}
