import {inject, InjectionToken} from '@angular/core';
import type {OpenCvRuntime} from '../interface/open-cv-runtime/open-cv-runtime.interface.ts';
import type {
  InitializingOpenCvExport
} from '../interface/initialzing-open-cv-export/initializing-open-cv-export.interface.ts';
import {unwrapDefaultExport} from './unwrap-default-export.function.ts';
import {isPromiseLike} from './is-promise-like.function.ts';
import {isOpenCvRuntime} from './is-open-cv-runtime.function.ts';
import {waitForRuntimeInitialization} from './wait-for-runtime-initialization.function.ts';


/** Normalizes namespace, promise, and callback-initialized package exports. */
export const normalizeOpenCvExport = new InjectionToken<(moduleValue: unknown) => Promise<OpenCvRuntime>
>(
  'normalizeOpenCvExport',
  {
    providedIn: 'root',
    factory: () => {

      const fn = (unwrapDefaultExport: (value: unknown) => unknown, isPromiseLike: (value: unknown) => value is PromiseLike<unknown>, isOpenCvRuntime: (value: unknown) => value is OpenCvRuntime, waitForRuntimeInitialization: (candidate: InitializingOpenCvExport) => Promise<void>) => {
        return async (moduleValue: unknown): Promise<OpenCvRuntime> => {
          let candidate = moduleValue;

          for (let attempt = 0; attempt < 4; attempt++) {
            candidate = unwrapDefaultExport(candidate);
            if (!isPromiseLike(candidate)) {
              break;
            }
            candidate = await candidate;
          }

          candidate = unwrapDefaultExport(candidate);
          if (isOpenCvRuntime(candidate)) {
            return candidate;
          }
          if ((typeof candidate !== 'object' || candidate === null) && typeof candidate !== 'function') {
            throw new Error('OpenCV module did not expose a runtime');
          }

          await waitForRuntimeInitialization(candidate as InitializingOpenCvExport);
          if (!isOpenCvRuntime(candidate)) {
            throw new Error('OpenCV runtime initialized without Mat support');
          }
          return candidate;
        }
      }


      return fn(inject(unwrapDefaultExport), inject(isPromiseLike), inject(isOpenCvRuntime), inject(waitForRuntimeInitialization))
    }
  }
)
