import { inject, InjectionToken } from '@angular/core';
import type { OpenCvRuntime } from '../interface/open-cv-runtime/open-cv-runtime.interface.ts';
import type { InitializingOpenCvExport } from '../interface/initialzing-open-cv-export/initializing-open-cv-export.interface.ts';
import { RUNTIME_INITIALIZATION_TIMEOUT_MS } from './runtime-initialization-timeout-ms.variable.ts';
import { isOpenCvRuntime } from './is-open-cv-runtime.function.ts';

/**
 * Wraps the Emscripten callback-based lifecycle (`onRuntimeInitialized` / `onAbort`)
 * in a Promise with watchdog timeout protection and deterministic settlement semantics.
 *
 * ### Emscripten Lifecycle Protocol
 * Emscripten WebAssembly modules bootstrap asynchronously:
 * 1. The JavaScript glue code instantiates immediately and exports the module shape.
 * 2. Asynchronous WebAssembly fetching, compilation, and memory table setup occur in the background.
 * 3. Upon successful initialization, Emscripten calls `Module.onRuntimeInitialized()`.
 * 4. If compilation or instantiation fails, Emscripten invokes `Module.onAbort(reason)`.
 *
 * ### Robustness & Concurrency Control
 * - **Settlement Latch (`settled` flag):** Prevents double-resolution/rejection if callbacks
 *   fire after a timeout or if multiple lifecycle events trigger concurrently.
 * - **Chaining Preservation:** Preserves and chains any pre-existing `onRuntimeInitialized` or
 *   `onAbort` handlers that may have been attached by external loaders or bundlers.
 * - **Watchdog Timeout:** Enforces a hard deadline (`timeoutMilliseconds`) to avoid hanging
 *   idle browser workers when CDN assets fail silently or stall.
 * - **Fast-Path Check:** If `isOpenCvRuntime(candidate)` is already true upon invocation
 *   (e.g., synchronous/pre-warmed runtime), the Promise settles immediately.
 *
 * @param candidate The initializing OpenCV module candidate.
 * @returns A Promise resolving when the runtime is ready for matrix operations.
 */
export const waitForRuntimeInitialization = new InjectionToken<
  (candidate: InitializingOpenCvExport) => Promise<void>
>('waitForRuntimeInitialization', {
  providedIn: 'root',
  factory: () => {
    const fn = (
      timeoutMilliseconds: number,
      isOpenCvRuntime: (value: unknown) => value is OpenCvRuntime,
    ) => {
      return (candidate: InitializingOpenCvExport): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
          let settled = false;
          const previousInitialized = candidate.onRuntimeInitialized;
          const previousAbort = candidate.onAbort;

          // Watchdog timer: reject if Emscripten fails to initialize within timeout window
          const timer = setTimeout(() => {
            finish(() => {
              reject(new Error('OpenCV runtime initialization timed out'));
            });
          }, timeoutMilliseconds);

          // Atomic settlement latch: ensures timer cleanup and single resolution
          const finish = (completion: () => void): void => {
            if (settled) {
              return;
            }
            settled = true;
            clearTimeout(timer);
            completion();
          };

          // Hook Emscripten success callback
          candidate.onRuntimeInitialized = () => {
            try {
              previousInitialized?.call(candidate);
              finish(resolve);
            } catch (error) {
              const rejectionError = error instanceof Error ? error : new Error(String(error));
              finish(() => {
                reject(rejectionError);
              });
            }
          };

          // Hook Emscripten abort callback
          candidate.onAbort = (reason: unknown) => {
            try {
              previousAbort?.call(candidate, reason);
            } finally {
              finish(() => {
                reject(new Error('OpenCV runtime initialization aborted'));
              });
            }
          };

          // Fast path: if already initialized prior to attaching handlers, settle immediately
          if (isOpenCvRuntime(candidate)) {
            finish(resolve);
          }
        });
      };
    };

    return fn(inject(RUNTIME_INITIALIZATION_TIMEOUT_MS), inject(isOpenCvRuntime));
  },
});
