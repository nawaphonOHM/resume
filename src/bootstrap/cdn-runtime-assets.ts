/** One pinned JavaScript entry in the production CDN module graph. */
export interface CdnRuntimeModuleAsset {
  readonly specifier: string;
  readonly href: string;
}

/** Every external production entry that must be available before bootstrap. */
export const CDN_RUNTIME_MODULE_ASSETS = [
  {
    specifier: '@angular/compiler',
    href: 'https://cdn.jsdelivr.net/npm/@angular/compiler@22.1.2/fesm2022/compiler.mjs',
  },
  {
    specifier: '@angular/core',
    href: 'https://cdn.jsdelivr.net/npm/@angular/core@22.1.2/fesm2022/core.mjs',
  },
  {
    specifier: '@angular/core/primitives/di',
    href: 'https://cdn.jsdelivr.net/npm/@angular/core@22.1.2/fesm2022/primitives-di.mjs',
  },
  {
    specifier: '@angular/core/primitives/signals',
    href: 'https://cdn.jsdelivr.net/npm/@angular/core@22.1.2/fesm2022/primitives-signals.mjs',
  },
  {
    specifier: '@angular/core/rxjs-interop',
    href: 'https://cdn.jsdelivr.net/npm/@angular/core@22.1.2/fesm2022/rxjs-interop.mjs',
  },
  {
    specifier: '@angular/common',
    href: 'https://cdn.jsdelivr.net/npm/@angular/common@22.1.2/fesm2022/common.mjs',
  },
  {
    specifier: '@angular/common/http',
    href: 'https://cdn.jsdelivr.net/npm/@angular/common@22.1.2/fesm2022/http.mjs',
  },
  {
    specifier: '@angular/platform-browser',
    href: 'https://cdn.jsdelivr.net/npm/@angular/platform-browser@22.1.2/fesm2022/platform-browser.mjs',
  },
  {
    specifier: '@angular/cdk/a11y',
    href: 'https://cdn.jsdelivr.net/npm/@angular/cdk@22.1.2/fesm2022/a11y.mjs',
  },
  {
    specifier: '@angular/cdk/bidi',
    href: 'https://cdn.jsdelivr.net/npm/@angular/cdk@22.1.2/fesm2022/bidi.mjs',
  },
  {
    specifier: '@angular/cdk/coercion',
    href: 'https://cdn.jsdelivr.net/npm/@angular/cdk@22.1.2/fesm2022/coercion.mjs',
  },
  {
    specifier: '@angular/cdk/keycodes',
    href: 'https://cdn.jsdelivr.net/npm/@angular/cdk@22.1.2/fesm2022/keycodes.mjs',
  },
  {
    specifier: '@angular/cdk/layout',
    href: 'https://cdn.jsdelivr.net/npm/@angular/cdk@22.1.2/fesm2022/layout.mjs',
  },
  {
    specifier: '@angular/cdk/observers/private',
    href: 'https://cdn.jsdelivr.net/npm/@angular/cdk@22.1.2/fesm2022/observers-private.mjs',
  },
  {
    specifier: '@angular/cdk/overlay',
    href: 'https://cdn.jsdelivr.net/npm/@angular/cdk@22.1.2/fesm2022/overlay.mjs',
  },
  {
    specifier: '@angular/cdk/platform',
    href: 'https://cdn.jsdelivr.net/npm/@angular/cdk@22.1.2/fesm2022/platform.mjs',
  },
  {
    specifier: '@angular/cdk/portal',
    href: 'https://cdn.jsdelivr.net/npm/@angular/cdk@22.1.2/fesm2022/portal.mjs',
  },
  {
    specifier: '@angular/cdk/private',
    href: 'https://cdn.jsdelivr.net/npm/@angular/cdk@22.1.2/fesm2022/private.mjs',
  },
  {
    specifier: '@angular/cdk/scrolling',
    href: 'https://cdn.jsdelivr.net/npm/@angular/cdk@22.1.2/fesm2022/scrolling.mjs',
  },
  {
    specifier: 'rxjs',
    href: 'https://cdn.jsdelivr.net/npm/rxjs@7.8.2/+esm',
  },
  {
    specifier: 'rxjs/operators',
    href: 'https://cdn.jsdelivr.net/npm/rxjs@7.8.2/operators/+esm',
  },
] as const satisfies readonly CdnRuntimeModuleAsset[];

/** Stylesheet loaded before the production résumé application starts. */
export const CDK_OVERLAY_STYLESHEET_ASSET = {
  id: 'angular-cdk-overlay-stylesheet',
  href: 'https://cdn.jsdelivr.net/npm/@angular/cdk@22.1.2/overlay-prebuilt.css',
  integrity: 'sha384-TzjTYTjA9SdI8tFIhEs9wgQHnG7eJKh8GWty2r91PSuseI9qo8FGgiscSxcXiKNn',
  crossOrigin: 'anonymous',
} as const;
