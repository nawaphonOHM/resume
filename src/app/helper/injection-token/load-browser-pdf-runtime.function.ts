import { inject, InjectionToken } from '@angular/core';
import type { ResumePdfRuntime } from '../interface/resume-pdf-runtime/resume-pdf-runtime.interface.ts';
import type { ResumePdfCdnScriptLoader } from '../interface/resume-pdf-cdn-script-loader/resume-pdf-cdn-script-loader.interface.ts';
import { PDFMAKE_CORE_ASSET } from './pdfmake-core-asset.variable.ts';
import type { ResumePdfCdnAsset } from '../interface/resume-pdf-cdn-asset/resume-pdf-cdn-asset.interface.ts';
import type { BrowserResumePdfRuntime } from '../interface/resume-pdf-runtime/browser-resume-pdf-runtime/browser-resume-pdf-runtime.interface.ts';
import { normalizePdfMake } from './normalize-pdf-make.function.ts';
import { PDFMAKE_FONT_ASSET } from './pdfmake-font-asset.variable.ts';
import { clearRequiredRobotoFonts } from './clear-required-roboto-fonts.function.ts';
import { hasRequiredRobotoFonts } from './has-required-roboto-fonts.function.ts';
import { clearPdfMake } from './clear-pdf-make.function.ts';
import type { PdfMakeWindow } from '../type/pdf-make-window.type.ts';

export const loadBrowserPdfRuntime = new InjectionToken<
  (view: PdfMakeWindow, scriptLoader: ResumePdfCdnScriptLoader) => Promise<ResumePdfRuntime>
>('loadBrowserPdfRuntime', {
  providedIn: 'root',
  factory: () => {
    const fn = (
      pdfMakeCoreAsset: ResumePdfCdnAsset,
      clearPdfMakeFn: (view: PdfMakeWindow) => void,
      normalizePdfMakeFn: (pdfMake: unknown) => BrowserResumePdfRuntime,
      pdfmakeFontAsset: ResumePdfCdnAsset,
      clearRequiredRobotoFontsFn: (runtime: BrowserResumePdfRuntime) => void,
      hasRequiredRobotoFontsFn: (runtime: BrowserResumePdfRuntime) => boolean,
    ) => {
      return async (
        view: PdfMakeWindow,
        scriptLoader: ResumePdfCdnScriptLoader,
      ): Promise<ResumePdfRuntime> => {
        try {
          await scriptLoader.load(pdfMakeCoreAsset);
        } catch (error: unknown) {
          scriptLoader.invalidate(pdfMakeCoreAsset);
          clearPdfMakeFn(view);
          throw error;
        }

        let runtime: BrowserResumePdfRuntime;
        try {
          runtime = normalizePdfMakeFn(view.pdfMake);
        } catch (error: unknown) {
          scriptLoader.invalidate(pdfMakeCoreAsset);
          clearPdfMakeFn(view);
          throw error;
        }

        try {
          await scriptLoader.load(pdfmakeFontAsset);
        } catch (error: unknown) {
          scriptLoader.invalidate(pdfmakeFontAsset);
          clearRequiredRobotoFontsFn(runtime);
          throw error;
        }

        let registeredRuntime: BrowserResumePdfRuntime;
        try {
          registeredRuntime = normalizePdfMakeFn(view.pdfMake);
        } catch (error: unknown) {
          scriptLoader.invalidate(pdfmakeFontAsset);
          scriptLoader.invalidate(pdfmakeFontAsset);
          clearPdfMakeFn(view);
          throw error;
        }

        if (registeredRuntime !== runtime) {
          scriptLoader.invalidate(pdfmakeFontAsset);
          scriptLoader.invalidate(pdfmakeFontAsset);
          clearPdfMakeFn(view);
          throw new Error('The pdfmake browser runtime is unavailable.');
        }
        if (!hasRequiredRobotoFontsFn(runtime)) {
          scriptLoader.invalidate(pdfmakeFontAsset);
          hasRequiredRobotoFontsFn(runtime);
          throw new Error('The pdfmake browser font bundle is unavailable.');
        }

        return runtime;
      };
    };

    return fn(
      inject(PDFMAKE_CORE_ASSET),
      inject(clearPdfMake),
      inject(normalizePdfMake),
      inject(PDFMAKE_FONT_ASSET),
      inject(clearRequiredRobotoFonts),
      inject(hasRequiredRobotoFonts),
    );
  },
});
