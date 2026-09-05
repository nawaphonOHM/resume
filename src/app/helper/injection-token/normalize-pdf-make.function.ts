import { InjectionToken } from '@angular/core';
import type { BrowserResumePdfRuntime } from '../interface/resume-pdf-runtime/browser-resume-pdf-runtime/browser-resume-pdf-runtime.interface.ts';

export const normalizePdfMake = new InjectionToken<(pdfMake: unknown) => BrowserResumePdfRuntime>(
  'normalizePdfMake',
  {
    providedIn: 'root',
    factory: () => {
      return (pdfMake: unknown): BrowserResumePdfRuntime => {
        if (
          !pdfMake ||
          (typeof pdfMake !== 'object' && typeof pdfMake !== 'function') ||
          typeof (pdfMake as Partial<BrowserResumePdfRuntime>).createPdf !== 'function' ||
          typeof (pdfMake as Partial<BrowserResumePdfRuntime>).addVirtualFileSystem !== 'function'
        ) {
          throw new Error('The pdfmake browser runtime is unavailable.');
        }
        return pdfMake as BrowserResumePdfRuntime;
      };
    },
  },
);
