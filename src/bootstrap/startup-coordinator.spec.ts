/** Verifies deterministic CDN readiness retries and startup selection. */
import { vi } from 'vitest';

import { CDN_STARTUP_CONFIGURATION, LOCAL_STARTUP_CONFIGURATION } from './runtime-config.ts';
import {
  coordinateStartup,
  type CdnRuntimeAttempt,
  type StartupDependencies,
} from './startup-coordinator.ts';

interface StartupHarness {
  readonly dependencies: StartupDependencies;
  readonly attemptTimes: number[];
  readonly cleanups: ReturnType<typeof vi.fn>[];
  readonly createCdnRuntimeAttempt: ReturnType<typeof vi.fn>;
  readonly startResume: ReturnType<typeof vi.fn>;
  readonly startFallback: ReturnType<typeof vi.fn>;
}

function createHarness(
  readiness: (retry: number) => Promise<void> = () => Promise.resolve(),
): StartupHarness {
  const attemptTimes: number[] = [];
  const cleanups: ReturnType<typeof vi.fn>[] = [];
  const createCdnRuntimeAttempt = vi.fn((retry: number): CdnRuntimeAttempt => {
    attemptTimes.push(Date.now());
    const cleanup = vi.fn();
    cleanups.push(cleanup);
    return { ready: readiness(retry), cleanup };
  });
  const startResume = vi.fn(async () => undefined);
  const startFallback = vi.fn(async () => undefined);

  return {
    dependencies: {
      createCdnRuntimeAttempt,
      wait: (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)),
      startResume,
      startFallback,
    },
    attemptTimes,
    cleanups,
    createCdnRuntimeAttempt,
    startResume,
    startFallback,
  };
}

describe('coordinateStartup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('uses the fixed OpenCV-compatible retry configuration', () => {
    expect(CDN_STARTUP_CONFIGURATION.retry).toEqual({
      retries: 3,
      delayMs: 1_000,
      delayMultiplier: 1.0,
      jitterMs: 0,
    });
  });

  it('starts the résumé after immediate CDN readiness', async () => {
    const harness = createHarness();

    await expect(coordinateStartup(CDN_STARTUP_CONFIGURATION, harness.dependencies)).resolves.toBe(
      'resume',
    );

    expect(harness.attemptTimes).toEqual([0]);
    expect(harness.startResume).toHaveBeenCalledOnce();
    expect(harness.startFallback).not.toHaveBeenCalled();
    expect(harness.cleanups[0]).not.toHaveBeenCalled();
  });

  it.each([1, 2, 3])(
    'recovers on retry %i at fixed one-second intervals',
    async (recoveryRetry) => {
      const harness = createHarness((retry) =>
        retry < recoveryRetry
          ? Promise.reject(new Error(`Synthetic CDN failure ${retry}`))
          : Promise.resolve(),
      );

      const pending = coordinateStartup(CDN_STARTUP_CONFIGURATION, harness.dependencies);
      await vi.advanceTimersByTimeAsync(recoveryRetry * 1_000);

      await expect(pending).resolves.toBe('resume');
      expect(harness.attemptTimes).toEqual(
        Array.from({ length: recoveryRetry + 1 }, (_, retry) => retry * 1_000),
      );
      expect(
        harness.cleanups
          .slice(0, recoveryRetry)
          .every((cleanup) => cleanup.mock.calls.length === 1),
      ).toBe(true);
      expect(harness.cleanups[recoveryRetry]).not.toHaveBeenCalled();
      expect(harness.startResume).toHaveBeenCalledOnce();
      expect(harness.startFallback).not.toHaveBeenCalled();
    },
  );

  it('starts the fallback after the initial attempt and all three retries fail', async () => {
    const harness = createHarness((retry) =>
      Promise.reject(new Error(`Synthetic CDN failure ${retry}`)),
    );

    const pending = coordinateStartup(CDN_STARTUP_CONFIGURATION, harness.dependencies);
    await vi.advanceTimersByTimeAsync(3_000);

    await expect(pending).resolves.toBe('fallback');
    expect(harness.attemptTimes).toEqual([0, 1_000, 2_000, 3_000]);
    expect(harness.cleanups.every((cleanup) => cleanup.mock.calls.length === 1)).toBe(true);
    expect(harness.startResume).not.toHaveBeenCalled();
    expect(harness.startFallback).toHaveBeenCalledOnce();
  });

  it('starts the fallback without another retry when the résumé import fails', async () => {
    const harness = createHarness();
    harness.startResume.mockRejectedValueOnce(new Error('Synthetic external module failure'));

    await expect(coordinateStartup(CDN_STARTUP_CONFIGURATION, harness.dependencies)).resolves.toBe(
      'fallback',
    );

    expect(harness.attemptTimes).toEqual([0]);
    expect(harness.cleanups[0]).toHaveBeenCalledOnce();
    expect(harness.startResume).toHaveBeenCalledOnce();
    expect(harness.startFallback).toHaveBeenCalledOnce();
  });

  it('bypasses CDN readiness and starts the locally bundled résumé in development', async () => {
    const harness = createHarness(() => Promise.reject(new Error('CDN must not be consulted')));

    await expect(
      coordinateStartup(LOCAL_STARTUP_CONFIGURATION, harness.dependencies),
    ).resolves.toBe('resume');

    expect(harness.createCdnRuntimeAttempt).not.toHaveBeenCalled();
    expect(harness.startResume).toHaveBeenCalledOnce();
    expect(harness.startFallback).not.toHaveBeenCalled();
  });
});
