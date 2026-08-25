import {InjectionToken} from '@angular/core';
import type {OpenCvRuntime} from '../interface/open-cv-runtime/open-cv-runtime.interface.ts';


/** A constructed `Mat` class marks a fully initialized OpenCV runtime. */
export const isOpenCvRuntime = new InjectionToken<(value: unknown) => value is OpenCvRuntime>(
  'isOpenCvRuntime',
  {
    providedIn: 'root',
    factory: () => {
      return (value: unknown): value is OpenCvRuntime => {
        return (
          ((typeof value === 'object' && value !== null) || typeof value === 'function') &&
          typeof (value as { readonly Mat?: unknown }).Mat === 'function'
        );
      };
    },
  }
)
