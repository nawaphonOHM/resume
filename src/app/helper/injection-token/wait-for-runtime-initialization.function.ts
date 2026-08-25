import {inject, InjectionToken} from '@angular/core';
import {OpenCvRuntime} from '../interface/open-cv-runtime/open-cv-runtime.interface.ts';
import {
  InitializingOpenCvExport
} from '../interface/initialzing-open-cv-export/initializing-open-cv-export.interface.ts';
import {RUNTIME_INITIALIZATION_TIMEOUT_MS} from './runtime-initialization-timeout-ms.variable.ts';
import {isOpenCvRuntime} from './is-open-cv-runtime.function.ts';


/** Waits for the callback-style Emscripten runtime without leaking failures. */
export const waitForRuntimeInitialization = new InjectionToken<(candidate: InitializingOpenCvExport) => Promise<void>>(
  'waitForRuntimeInitialization',
  {
    providedIn: 'root',
    factory: () => {
      const fn =

        (timeoutMilliseconds: number, isOpenCvRuntime: (value: unknown) => value is OpenCvRuntime) => {

          return (candidate: InitializingOpenCvExport): Promise<void> => {
            return new Promise<void>((resolve, reject) => {
              let settled = false;
              const previousInitialized = candidate.onRuntimeInitialized;
              const previousAbort = candidate.onAbort;
              const timer = setTimeout(() => {
                finish(() => reject(new Error('OpenCV runtime initialization timed out')));
              }, timeoutMilliseconds);

              const finish = (completion: () => void): void => {
                if (settled) {
                  return;
                }
                settled = true;
                clearTimeout(timer);
                completion();
              };

              candidate.onRuntimeInitialized = () => {
                try {
                  previousInitialized?.call(candidate);
                  finish(resolve);
                } catch (error) {
                  finish(() => reject(error));
                }
              };
              candidate.onAbort = (reason: unknown) => {
                try {
                  previousAbort?.call(candidate, reason);
                } finally {
                  finish(() => reject(new Error('OpenCV runtime initialization aborted')));
                }
              };

              if (isOpenCvRuntime(candidate)) {
                finish(resolve);
              }
            });
          }

        }

      return fn(inject(RUNTIME_INITIALIZATION_TIMEOUT_MS), inject(isOpenCvRuntime))
    }
  }
)
