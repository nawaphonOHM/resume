import { inject, InjectionToken } from '@angular/core';
import type { OpenCvRuntime } from '../interface/open-cv-runtime/open-cv-runtime.interface.ts';
import type { InitializingOpenCvExport } from '../interface/initialzing-open-cv-export/initializing-open-cv-export.interface.ts';
import { unwrapDefaultExport } from './unwrap-default-export.function.ts';
import { isPromiseLike } from './is-promise-like.function.ts';
import { isOpenCvRuntime } from './is-open-cv-runtime.function.ts';
import { waitForRuntimeInitialization } from './wait-for-runtime-initialization.function.ts';

/**
 * Normalizes diverse OpenCV WebAssembly module exports across varying CDN,
 * bundler, and module format environments into a fully initialized `OpenCvRuntime`.
 *
 * ### Problem & Context
 * OpenCV.js distributions are packaged inconsistently across modern web toolchains:
 * 1. **ES Module Wrappers:** Bundlers (Vite/Webpack/esbuild) often wrap the module in `{ default: ... }`.
 * 2. **Nested Default Exports:** Multi-stage bundling or CDN interop layers can produce multiple nested default layers (`export.default.default`).
 * 3. **Promise / Thenable Factories:** Dynamic imports or async factory functions return Promises resolving to the Emscripten module.
 * 4. **Asynchronous Emscripten Initialization:** The underlying WebAssembly binary compiles asynchronously; the module object exists immediately but its methods (like `cv.Mat`) only attach after `onRuntimeInitialized` fires.
 *
 * ### Normalization Pipeline
 * 1. **Unwrap Loop (up to 4 iterations):** Repeatedly strips `.default` wrappers and awaits thenables until reaching a stable object.
 * 2. **Fast-Path Inspection:** If the object already contains the `Mat` constructor (`isOpenCvRuntime`), return immediately.
 * 3. **Emscripten Callback Hooking:** If not yet initialized, delegates to `waitForRuntimeInitialization` to await the `onRuntimeInitialized` lifecycle hook.
 * 4. **Runtime Integrity Verification:** Re-verifies that `isOpenCvRuntime` passes, throwing a descriptive error if the runtime failed to expose the C++ bindings.
 *
 * @param moduleValue The raw export from a dynamic import, CDN script, or global namespace.
 * @returns A Promise resolving to the ready-to-use `OpenCvRuntime`.
 */
export const normalizeOpenCvExport = new InjectionToken<
  (moduleValue: unknown) => Promise<OpenCvRuntime>
>('normalizeOpenCvExport', {
  providedIn: 'root',
  factory: () => {
    const fn = (
      unwrapDefaultExport: (value: unknown) => unknown,
      isPromiseLike: (value: unknown) => value is PromiseLike<unknown>,
      isOpenCvRuntime: (value: unknown) => value is OpenCvRuntime,
      waitForRuntimeInitialization: (candidate: InitializingOpenCvExport) => Promise<void>,
    ) => {
      return async (moduleValue: unknown): Promise<OpenCvRuntime> => {
        let candidate = moduleValue;

        // Step 1: Peel up to 4 layers of nested default exports and resolved Promises
        for (let attempt = 0; attempt < 4; attempt++) {
          candidate = unwrapDefaultExport(candidate);
          if (!isPromiseLike(candidate)) {
            break;
          }
          candidate = await candidate;
        }

        candidate = unwrapDefaultExport(candidate);

        // Step 2: Fast path - runtime is already compiled and initialized
        if (isOpenCvRuntime(candidate)) {
          return candidate;
        }

        // Step 3: Validate candidate is an object or function capable of hosting Emscripten hooks
        if (
          (typeof candidate !== 'object' || candidate === null) &&
          typeof candidate !== 'function'
        ) {
          throw new Error('OpenCV module did not expose a runtime');
        }

        // Step 4: Await the asynchronous WebAssembly compilation and runtime initialization hook
        await waitForRuntimeInitialization(candidate as InitializingOpenCvExport);

        // Step 5: Final integrity check ensuring OpenCV C++ bindings (cv.Mat) are exposed
        if (!isOpenCvRuntime(candidate)) {
          throw new Error('OpenCV runtime initialized without Mat support');
        }
        return candidate;
      };
    };

    return fn(
      inject(unwrapDefaultExport),
      inject(isPromiseLike),
      inject(isOpenCvRuntime),
      inject(waitForRuntimeInitialization),
    );
  },
});
