import { inject, InjectionToken, PLATFORM_ID } from '@angular/core';
import type { ResumePdfRuntimeLoader } from '../type/resume-pdf-runtime-loader.type.ts';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { RESUME_PDF_CDN_SCRIPT_LOADER } from './resume-pdf-con-script-loader.function.ts';
import { loadBrowserPdfRuntime } from './load-browser-pdf-runtime.function.ts';

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
        return inject(loadBrowserPdfRuntime)(view, scriptLoader);
      };
    },
  },
);
