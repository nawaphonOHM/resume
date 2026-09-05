import { inject, InjectionToken, PLATFORM_ID } from '@angular/core';
import type { ResumePdfCdnScriptLoader } from '../interface/resume-pdf-cdn-script-loader/resume-pdf-cdn-script-loader.interface.ts';
import { DOCUMENT } from '@angular/common';
import { createCdnScriptLoader } from './create-cdn-script-loader.function.ts';

/** Integrity-checked DOM loader shared by the production runtime and replaceable in tests. */
export const RESUME_PDF_CDN_SCRIPT_LOADER = new InjectionToken<ResumePdfCdnScriptLoader>(
  'RESUME_PDF_CDN_SCRIPT_LOADER',
  {
    providedIn: 'root',
    factory: () => inject(createCdnScriptLoader)(inject(DOCUMENT), inject(PLATFORM_ID)),
  },
);
