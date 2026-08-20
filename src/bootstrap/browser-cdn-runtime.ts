import type { CdnRuntimeModuleAsset } from './cdn-runtime-assets';
import type { StartupConfiguration } from './runtime-config';
import type { CdnRuntimeAttempt } from './startup-coordinator';

interface AvailabilityResponse {
  readonly ok: boolean;
  readonly status: number;
}

/** Browser operations injected into CDN attempts for deterministic tests. */
export interface CdnRuntimeBrowserBoundaries {
  readonly document: Document;
  readonly fetch: (sourceUrl: string, init: RequestInit) => Promise<AvailabilityResponse>;
  readonly createAbortController: () => AbortController;
}

interface StylesheetLoad {
  readonly ready: Promise<void>;

  cleanup(): void;
}

/** Adds the same deterministic retry marker used by the OpenCV loader. */
export function createRetryUrl(sourceUrl: string, retry: number): string {
  if (retry === 0) {
    return sourceUrl;
  }
  const separator = sourceUrl.includes('?') ? '&' : '?';
  return `${sourceUrl}${separator}retry=${retry}`;
}

function loadStylesheet(
  configuration: StartupConfiguration,
  retry: number,
  document: Document,
): StylesheetLoad {
  const asset = configuration.stylesheetAsset;
  document.getElementById(asset.id)?.remove();

  const link = document.createElement('link');
  link.id = asset.id;
  link.rel = 'stylesheet';
  link.href = createRetryUrl(asset.href, retry);
  link.integrity = asset.integrity;
  link.crossOrigin = asset.crossOrigin;
  link.dataset['cdnRuntimeState'] = 'loading';

  let settled = false;
  let rejectLoad: (error: Error) => void = () => undefined;
  const ready = new Promise<void>((resolve, reject) => {
    rejectLoad = reject;
    link.onload = () => {
      if (settled) {
        return;
      }
      settled = true;
      link.onload = null;
      link.onerror = null;
      link.dataset['cdnRuntimeState'] = 'loaded';
      resolve();
    };
    link.onerror = () => {
      if (settled) {
        return;
      }
      settled = true;
      link.onload = null;
      link.onerror = null;
      link.dataset['cdnRuntimeState'] = 'failed';
      reject(new Error(`CDK overlay stylesheet is unavailable: ${link.href}`));
    };
  });

  document.head.append(link);

  return {
    ready,
    cleanup: () => {
      if (!settled) {
        settled = true;
        rejectLoad(new Error(`CDK overlay stylesheet loading was cancelled: ${link.href}`));
      }
      link.onload = null;
      link.onerror = null;
      link.remove();
    },
  };
}

async function checkModuleAvailability(
  asset: CdnRuntimeModuleAsset,
  retry: number,
  signal: AbortSignal,
  fetch: CdnRuntimeBrowserBoundaries['fetch'],
): Promise<void> {
  const sourceUrl = createRetryUrl(asset.href, retry);
  const response = await fetch(sourceUrl, {
    method: 'HEAD',
    mode: 'cors',
    cache: 'no-store',
    credentials: 'omit',
    signal,
  });
  if (!response.ok) {
    throw new Error(`${asset.specifier} is unavailable from ${sourceUrl} (${response.status})`);
  }
}

/** Creates one abortable module-graph preflight and stylesheet load. */
export function createBrowserCdnRuntimeAttempt(
  configuration: StartupConfiguration,
  retry: number,
  boundaries: CdnRuntimeBrowserBoundaries,
): CdnRuntimeAttempt {
  const controller = boundaries.createAbortController();
  const stylesheet = loadStylesheet(configuration, retry, boundaries.document);
  let cleaned = false;
  const cleanup = (): void => {
    if (cleaned) {
      return;
    }
    cleaned = true;
    controller.abort();
    stylesheet.cleanup();
  };
  const moduleChecks = configuration.moduleAssets.map((asset) =>
    checkModuleAvailability(asset, retry, controller.signal, boundaries.fetch),
  );
  const ready = Promise.all([stylesheet.ready, ...moduleChecks])
    .then(() => undefined)
    .catch((error: unknown) => {
      cleanup();
      throw error;
    });

  return { ready, cleanup };
}
