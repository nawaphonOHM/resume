import { inject, InjectionToken } from '@angular/core';
import type { BrowserResumePdfRuntime } from '../interface/resume-pdf-runtime/browser-resume-pdf-runtime/browser-resume-pdf-runtime.interface.ts';
import { REQUIRED_ROBOTO_FONTS } from './required-roboto-fonts.type.ts';

export const clearRequiredRobotoFonts = new InjectionToken<
  (runtime: BrowserResumePdfRuntime) => void
>('clearRequiredRobotoFonts', {
  providedIn: 'root',
  factory: () => {
    const fn = (requiredRobotoFonts: string[]) => {
      return (runtime: BrowserResumePdfRuntime): void => {
        const storage = runtime.virtualfs?.storage;
        if (!storage || typeof storage !== 'object' || Array.isArray(storage)) {
          return;
        }
        for (const font of requiredRobotoFonts) {
          Reflect.deleteProperty(storage, font);
        }
      };
    };

    return fn(inject(REQUIRED_ROBOTO_FONTS));
  },
});
