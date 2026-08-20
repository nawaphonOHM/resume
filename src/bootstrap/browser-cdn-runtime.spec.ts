/** Verifies browser resource loading and cleanup around one CDN attempt. */
import { vi } from 'vitest';

import {
  createBrowserCdnRuntimeAttempt,
  createRetryUrl,
  type CdnRuntimeBrowserBoundaries,
} from './browser-cdn-runtime.ts';
import { CDN_STARTUP_CONFIGURATION, type StartupConfiguration } from './runtime-config.ts';

function createConfiguration(moduleCount = 2): StartupConfiguration {
  return {
    ...CDN_STARTUP_CONFIGURATION,
    moduleAssets: CDN_STARTUP_CONFIGURATION.moduleAssets.slice(0, moduleCount),
  };
}

function createBoundaries(
  fetch: CdnRuntimeBrowserBoundaries['fetch'],
): CdnRuntimeBrowserBoundaries {
  return {
    document,
    fetch,
    createAbortController: () => new AbortController(),
  };
}

describe('createBrowserCdnRuntimeAttempt', () => {
  afterEach(() => {
    document.head.querySelectorAll('link').forEach((link) => link.remove());
    vi.restoreAllMocks();
  });

  it('checks every pinned module URL and waits for the SRI stylesheet', async () => {
    const configuration = createConfiguration();
    const fetch = vi.fn<CdnRuntimeBrowserBoundaries['fetch']>(async () => ({
      ok: true,
      status: 200,
    }));

    const attempt = createBrowserCdnRuntimeAttempt(configuration, 2, createBoundaries(fetch));
    const link = document.getElementById(configuration.stylesheetAsset.id) as HTMLLinkElement;

    expect(link.dataset['cdnRuntimeState']).toBe('loading');
    expect(link.href).toBe(`${configuration.stylesheetAsset.href}?retry=2`);
    expect(link.integrity).toBe(configuration.stylesheetAsset.integrity);
    expect(link.crossOrigin).toBe(configuration.stylesheetAsset.crossOrigin);
    expect(fetch.mock.calls.map(([sourceUrl]) => sourceUrl)).toEqual(
      configuration.moduleAssets.map(({ href }) => `${href}?retry=2`),
    );
    expect(
      fetch.mock.calls.every(
        ([, init]) =>
          init.method === 'HEAD' &&
          init.mode === 'cors' &&
          init.cache === 'no-store' &&
          init.credentials === 'omit',
      ),
    ).toBe(true);

    link.dispatchEvent(new Event('load'));
    await expect(attempt.ready).resolves.toBeUndefined();

    expect(link.dataset['cdnRuntimeState']).toBe('loaded');
    expect(link.isConnected).toBe(true);
  });

  it('removes a failed stylesheet and aborts module checks', async () => {
    const configuration = createConfiguration(1);
    const fetch = vi.fn<CdnRuntimeBrowserBoundaries['fetch']>(async () => ({
      ok: true,
      status: 200,
    }));
    const attempt = createBrowserCdnRuntimeAttempt(configuration, 0, createBoundaries(fetch));
    const link = document.getElementById(configuration.stylesheetAsset.id) as HTMLLinkElement;
    const signal = fetch.mock.calls[0][1].signal as AbortSignal;

    link.dispatchEvent(new Event('error'));
    await expect(attempt.ready).rejects.toThrow('CDK overlay stylesheet is unavailable');

    expect(signal.aborted).toBe(true);
    expect(document.getElementById(configuration.stylesheetAsset.id)).toBeNull();
  });

  it('removes an in-flight stylesheet when a module check fails', async () => {
    const configuration = createConfiguration(1);
    const fetch = vi.fn<CdnRuntimeBrowserBoundaries['fetch']>(async () => ({
      ok: false,
      status: 503,
    }));
    const attempt = createBrowserCdnRuntimeAttempt(configuration, 3, createBoundaries(fetch));
    const link = document.getElementById(configuration.stylesheetAsset.id) as HTMLLinkElement;

    await expect(attempt.ready).rejects.toThrow(
      `${configuration.moduleAssets[0].specifier} is unavailable`,
    );

    expect(link.dataset['cdnRuntimeState']).toBe('loading');
    expect(link.isConnected).toBe(false);
    expect(link.onload).toBeNull();
    expect(link.onerror).toBeNull();
  });

  it('replaces a resource left by an earlier incomplete attempt', async () => {
    const configuration = createConfiguration(0);
    const staleLink = document.createElement('link');
    staleLink.id = configuration.stylesheetAsset.id;
    staleLink.dataset['cdnRuntimeState'] = 'loading';
    document.head.append(staleLink);

    const attempt = createBrowserCdnRuntimeAttempt(
      configuration,
      1,
      createBoundaries(
        vi.fn<CdnRuntimeBrowserBoundaries['fetch']>(async () => ({
          ok: true,
          status: 200,
        })),
      ),
    );
    const currentLink = document.getElementById(
      configuration.stylesheetAsset.id,
    ) as HTMLLinkElement;

    expect(staleLink.isConnected).toBe(false);
    expect(currentLink).not.toBe(staleLink);
    expect(currentLink.dataset['cdnRuntimeState']).toBe('loading');

    currentLink.dispatchEvent(new Event('load'));
    await expect(attempt.ready).resolves.toBeUndefined();
  });
});

describe('createRetryUrl', () => {
  it('keeps the initial URL exact and appends deterministic retry markers', () => {
    expect(createRetryUrl('https://cdn.example/runtime.mjs', 0)).toBe(
      'https://cdn.example/runtime.mjs',
    );
    expect(createRetryUrl('https://cdn.example/runtime.mjs', 1)).toBe(
      'https://cdn.example/runtime.mjs?retry=1',
    );
    expect(createRetryUrl('https://cdn.example/runtime.mjs?module', 3)).toBe(
      'https://cdn.example/runtime.mjs?module&retry=3',
    );
  });
});
