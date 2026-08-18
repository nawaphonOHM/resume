import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, InjectionToken, PLATFORM_ID, inject } from '@angular/core';

import { RESUME } from '../../data/resume/resume.data';
import {
  buildResumeDocumentDefinition,
  validateResumePdfBytes,
  type ResumePdfDocumentDefinition,
} from './resume-pdf-document';

export const RESUME_PDF_FILENAME = 'nawaphon-isarathanachaikul-resume.pdf';

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

interface BrowserResumePdfRuntime extends ResumePdfRuntime {
  addVirtualFileSystem(virtualFileSystem: Readonly<Record<string, string>>): void;
}

function unwrapDefaultExport(value: unknown): unknown {
  if (value && typeof value === 'object' && 'default' in value) {
    return value.default;
  }
  return value;
}

function normalizePdfMake(value: unknown): BrowserResumePdfRuntime {
  const pdfMake = unwrapDefaultExport(value);
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

function normalizeVirtualFileSystem(value: unknown): Readonly<Record<string, string>> {
  const virtualFileSystem = unwrapDefaultExport(value);
  if (
    !virtualFileSystem ||
    typeof virtualFileSystem !== 'object' ||
    Array.isArray(virtualFileSystem) ||
    Object.keys(virtualFileSystem).length === 0 ||
    !Object.values(virtualFileSystem).every((font) => typeof font === 'string')
  ) {
    throw new Error('The pdfmake browser font bundle is unavailable.');
  }
  return virtualFileSystem as Readonly<Record<string, string>>;
}

async function loadBrowserPdfRuntime(): Promise<ResumePdfRuntime> {
  const [pdfMakeModule, fontModule] = await Promise.all([
    import('pdfmake/build/pdfmake.js'),
    import('pdfmake/build/vfs_fonts.js'),
  ]);
  const pdfMake = normalizePdfMake(pdfMakeModule);
  pdfMake.addVirtualFileSystem(normalizeVirtualFileSystem(fontModule));
  return pdfMake;
}

/**
 * Loader whose factory itself stays inert so pdfmake and its fonts remain out
 * of the initial bundle until the returned function is explicitly invoked.
 */
export const RESUME_PDF_RUNTIME_LOADER = new InjectionToken<ResumePdfRuntimeLoader>(
  'RESUME_PDF_RUNTIME_LOADER',
  {
    providedIn: 'root',
    factory: () => loadBrowserPdfRuntime,
  },
);

/** Lazily generates, validates, and downloads the canonical résumé PDF. */
@Injectable({ providedIn: 'root' })
export class ResumePdfService {
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
