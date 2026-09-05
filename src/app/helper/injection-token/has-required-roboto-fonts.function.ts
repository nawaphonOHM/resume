import { inject, InjectionToken } from '@angular/core';
import type { BrowserResumePdfRuntime } from '../interface/resume-pdf-runtime/browser-resume-pdf-runtime/browser-resume-pdf-runtime.interface.ts';
import { REQUIRED_ROBOTO_FONTS } from './required-roboto-fonts.type.ts';

export const hasRequiredRobotoFonts = new InjectionToken<
  (runtime: BrowserResumePdfRuntime) => boolean
>('hasRequiredRobotoFonts', {
  providedIn: 'root',
  factory: () => {
    const fn = (requiredRobotoFonts: string[]) => {
      return (runtime: BrowserResumePdfRuntime): boolean => {
        const storage = runtime.virtualfs?.storage;
        return (
          !!storage &&
          typeof storage === 'object' &&
          !Array.isArray(storage) &&
          requiredRobotoFonts.every(
            (font) => Object.prototype.hasOwnProperty.call(storage, font) && storage[font] != null,
          )
        );
      };
    };

    return fn(inject(REQUIRED_ROBOTO_FONTS));
  },
});
