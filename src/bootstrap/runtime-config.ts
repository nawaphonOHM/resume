import {
  CDK_OVERLAY_STYLESHEET_ASSET,
  CDN_RUNTIME_MODULE_ASSETS,
  type CdnRuntimeModuleAsset,
} from './cdn-runtime-assets';

/** Fixed retry policy shared with the existing OpenCV CDN convention. */
export interface StartupRetryConfiguration {
  readonly retries: number;
  readonly delayMs: number;
  readonly delayMultiplier: number;
  readonly jitterMs: number;
}

/** Framework-free settings consumed before any Angular module is requested. */
export interface StartupConfiguration {
  readonly cdnRuntimeEnabled: boolean;
  readonly retry: StartupRetryConfiguration;
  readonly moduleAssets: readonly CdnRuntimeModuleAsset[];
  readonly stylesheetAsset: typeof CDK_OVERLAY_STYLESHEET_ASSET;
  readonly fallbackEntry: string;
}

export const STARTUP_RETRY_CONFIGURATION: StartupRetryConfiguration = {
  retries: 3,
  delayMs: 1_000,
  delayMultiplier: 1.0,
  jitterMs: 0,
};

const COMMON_STARTUP_CONFIGURATION = {
  retry: STARTUP_RETRY_CONFIGURATION,
  moduleAssets: CDN_RUNTIME_MODULE_ASSETS,
  stylesheetAsset: CDK_OVERLAY_STYLESHEET_ASSET,
  fallbackEntry: 'fallback/main.js',
} as const;

/** Network-independent configuration used by development and unit tests. */
export const LOCAL_STARTUP_CONFIGURATION: StartupConfiguration = {
  ...COMMON_STARTUP_CONFIGURATION,
  cdnRuntimeEnabled: false,
};

/** CDN-gated configuration selected only by the production résumé build. */
export const CDN_STARTUP_CONFIGURATION: StartupConfiguration = {
  ...COMMON_STARTUP_CONFIGURATION,
  cdnRuntimeEnabled: true,
};
