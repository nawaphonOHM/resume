import { InjectionToken } from '@angular/core';
import type { ResumePdfCdnScriptLoader } from '../interface/resume-pdf-cdn-script-loader/resume-pdf-cdn-script-loader.interface.ts';
import { isPlatformBrowser } from '@angular/common';
import type { ResumePdfCdnAsset } from '../interface/resume-pdf-cdn-asset/resume-pdf-cdn-asset.interface.ts';

export const createCdnScriptLoader = new InjectionToken<
  (document: Document, platformId: object) => ResumePdfCdnScriptLoader
>('createCdnScriptLoader', {
  providedIn: 'root',
  factory: () => {
    return (document: Document, platformId: object): ResumePdfCdnScriptLoader => {
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
            discard(
              error = new Error(`The pdfmake CDN script was invalidated: ${asset.url}`),
            ): void {
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
    };
  },
});
