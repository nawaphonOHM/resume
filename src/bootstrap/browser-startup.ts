import { createBrowserCdnRuntimeAttempt } from './browser-cdn-runtime';
import { STARTUP_CONFIGURATION } from './startup-config';
import { coordinateStartup, type StartupDestination } from './startup-coordinator';

function importLocalEntry(sourceUrl: string): Promise<unknown> {
  return import(sourceUrl) as Promise<unknown>;
}

/** Connects framework-free browser operations to the startup coordinator. */
export function startBrowserApplication(): Promise<StartupDestination> {
  return coordinateStartup(STARTUP_CONFIGURATION, {
    createCdnRuntimeAttempt: (retry) =>
      createBrowserCdnRuntimeAttempt(STARTUP_CONFIGURATION, retry, {
        document,
        fetch: (sourceUrl, init) => globalThis.fetch(sourceUrl, init),
        createAbortController: () => new AbortController(),
      }),
    wait: (delayMs) => new Promise((resolve) => globalThis.setTimeout(resolve, delayMs)),
    startResume: async () => {
      await import('@angular/compiler');
      const { bootstrapResumeApplication } = await import('./resume-bootstrap');
      await bootstrapResumeApplication();
    },
    startFallback: async () => {
      const sourceUrl = new URL(STARTUP_CONFIGURATION.fallbackEntry, document.baseURI).href;
      await importLocalEntry(sourceUrl);
    },
  });
}
