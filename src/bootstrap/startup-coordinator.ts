import type { StartupConfiguration } from './runtime-config';

/** One cancellable production readiness attempt. */
export interface CdnRuntimeAttempt {
  readonly ready: Promise<void>;

  cleanup(): void;
}

/** Replaceable side effects surrounding the pure startup decision flow. */
export interface StartupDependencies {
  createCdnRuntimeAttempt(retry: number): CdnRuntimeAttempt;

  wait(delayMs: number): Promise<void>;

  startResume(): Promise<unknown>;

  startFallback(): Promise<unknown>;
}

export type StartupDestination = 'resume' | 'fallback';

function cleanupAttempt(attempt: CdnRuntimeAttempt | undefined): void {
  try {
    attempt?.cleanup();
  } catch {
    // Cleanup cannot prevent the next readiness attempt or local fallback.
  }
}

function retryDelay(configuration: StartupConfiguration, retry: number): number {
  const { delayMs, delayMultiplier, jitterMs } = configuration.retry;
  return delayMs * delayMultiplier ** (retry - 1) + jitterMs;
}

/** Selects exactly one application after local bypass or deterministic CDN retries. */
export async function coordinateStartup(
  configuration: StartupConfiguration,
  dependencies: StartupDependencies,
): Promise<StartupDestination> {
  if (!configuration.cdnRuntimeEnabled) {
    await dependencies.startResume();
    return 'resume';
  }

  for (let retry = 0; retry <= configuration.retry.retries; retry++) {
    if (retry > 0) {
      await dependencies.wait(retryDelay(configuration, retry));
    }

    let attempt: CdnRuntimeAttempt | undefined;
    try {
      attempt = dependencies.createCdnRuntimeAttempt(retry);
      await attempt.ready;
    } catch {
      cleanupAttempt(attempt);
      continue;
    }

    try {
      await dependencies.startResume();
      return 'resume';
    } catch {
      cleanupAttempt(attempt);
      await dependencies.startFallback();
      return 'fallback';
    }
  }

  await dependencies.startFallback();
  return 'fallback';
}
