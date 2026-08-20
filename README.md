[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![Dependabot Updates](https://github.com/nawaphonOHM/resume/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/nawaphonOHM/resume/actions/workflows/dependabot/dependabot-updates)

# Nawaphon Isarathanachaikul — Résumé Portfolio

A public Angular single-page résumé built with Angular Material and Tailwind CSS. It includes responsive section navigation, remembered light and dark themes, browser-print styling, and a user-triggered, phone-redacted PDF download.

## Requirements

- Node.js 22.22.3 or newer
- npm 10

## Install and run locally

```bash
npm ci
npm start
```

Open `http://localhost:4200/`. The development server reloads when source files change.

## Edit résumé content

All publishable résumé facts live in `src/app/data/resume/resume.data.ts` and conform to the contracts in `src/app/model/resume/resume.model.ts`. Update that data source rather than duplicating content in component templates.

The phone value must remain `Available on request`. Do not add a phone number, a `tel:` link, or the private source PDF anywhere under the project.

## Static assets

All project-owned images are served from the DigitalOcean Space origin `https://resume-images.ohm-mho.space`. Résumé and technology image object keys start directly with the root-level `/company-logos/...`, `/link-logos/...`, `/technology-icons/...`, or `/university-logos/...` category paths. The favicon is served separately from `/favicon.svg`, and object URLs must not include `/public`.

The Space must allow unauthenticated public `GET` requests. It must also return an appropriate `Access-Control-Allow-Origin` header for canvas-based technology-icon contrast optimization. If an image or CORS access fails, the application does not use a local fallback or custom placeholder.

The résumé PDF is generated in the browser and is not a local static asset. There is no stable `/downloads/...` PDF URL to configure or deploy.

## On-demand résumé PDF

Activating either Download PDF control generates the résumé directly from the canonical typed résumé data. Only after the first activation, the browser loads these immutable cdnjs assets in order (core first, then the Roboto virtual fonts):

- `https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.3.3/pdfmake.min.js` (`sha512-EkS5jkn3vXRWIdphIy51xskMZggNip3Or8kpe/FlM5XaQeiK2GZJ9OwrIEbXl6txKWsHNtm4OXtxzkkz41Mspw==`)
- `https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.3.3/vfs_fonts.min.js` (`sha512-rpvsrDF7BNgiFOXqkKyyoJ46jZ8nwQ3NJJAmpYnYKuZHfzwR2wpz5cAaPX09RCj9un5E+ErATIqy4CZBcuNogA==`)

Both scripts use Subresource Integrity, anonymous CORS, and a no-referrer policy. Successful and in-flight loads are reused, while a CDN outage, blocked script, integrity mismatch, or incompatible runtime fails the current request without creating a download and leaves both controls retryable. Production has no bundled fallback.

Deployments that enforce Content Security Policy must allow `https://cdnjs.cloudflare.com` in `script-src`. Do not use cdnjs's `latest` alias. When upgrading, update both pinned CDN versions, both published SRI hashes, and the exact development-only `pdfmake` version together; the npm package is used solely as the network-independent integration-test fixture.

Before starting the download, the application verifies the PDF header, minimum size, required links, content safeguards, and absence of phone or `tel:` data. Installation, production builds, and initial page loads perform no PDF generation.

## Production Angular/CDK CDN runtime

Local development and unit tests resolve Angular, Material, CDK, and RxJS from `node_modules` and do not require jsDelivr. Only the production `resume` target externalizes the JavaScript entry points used by the application. `@angular/cdk` must remain installed: TypeScript compilation, Angular Material's peer dependency, and Material Sass processing still require the npm package.

The production import map in `src/index.html` and the readiness manifest in `src/bootstrap/cdn-runtime-assets.ts` define one exact-version module graph:

- Angular 22.1.2 raw FESM2022:
  - `https://cdn.jsdelivr.net/npm/@angular/compiler@22.1.2/fesm2022/compiler.mjs`
  - `https://cdn.jsdelivr.net/npm/@angular/core@22.1.2/fesm2022/core.mjs`
  - `https://cdn.jsdelivr.net/npm/@angular/core@22.1.2/fesm2022/primitives-di.mjs`
  - `https://cdn.jsdelivr.net/npm/@angular/core@22.1.2/fesm2022/primitives-signals.mjs`
  - `https://cdn.jsdelivr.net/npm/@angular/core@22.1.2/fesm2022/rxjs-interop.mjs`
  - `https://cdn.jsdelivr.net/npm/@angular/common@22.1.2/fesm2022/common.mjs`
  - `https://cdn.jsdelivr.net/npm/@angular/common@22.1.2/fesm2022/http.mjs`
  - `https://cdn.jsdelivr.net/npm/@angular/platform-browser@22.1.2/fesm2022/platform-browser.mjs`
- Angular CDK 22.1.2 raw FESM2022:
  - `https://cdn.jsdelivr.net/npm/@angular/cdk@22.1.2/fesm2022/a11y.mjs`
  - `https://cdn.jsdelivr.net/npm/@angular/cdk@22.1.2/fesm2022/bidi.mjs`
  - `https://cdn.jsdelivr.net/npm/@angular/cdk@22.1.2/fesm2022/coercion.mjs`
  - `https://cdn.jsdelivr.net/npm/@angular/cdk@22.1.2/fesm2022/keycodes.mjs`
  - `https://cdn.jsdelivr.net/npm/@angular/cdk@22.1.2/fesm2022/layout.mjs`
  - `https://cdn.jsdelivr.net/npm/@angular/cdk@22.1.2/fesm2022/observers-private.mjs`
  - `https://cdn.jsdelivr.net/npm/@angular/cdk@22.1.2/fesm2022/overlay.mjs`
  - `https://cdn.jsdelivr.net/npm/@angular/cdk@22.1.2/fesm2022/platform.mjs`
  - `https://cdn.jsdelivr.net/npm/@angular/cdk@22.1.2/fesm2022/portal.mjs`
  - `https://cdn.jsdelivr.net/npm/@angular/cdk@22.1.2/fesm2022/private.mjs`
  - `https://cdn.jsdelivr.net/npm/@angular/cdk@22.1.2/fesm2022/scrolling.mjs`
- RxJS 7.8.2:
  - `https://cdn.jsdelivr.net/npm/rxjs@7.8.2/+esm`
  - `https://cdn.jsdelivr.net/npm/rxjs@7.8.2/operators/+esm`
- CDK overlay styles: `https://cdn.jsdelivr.net/npm/@angular/cdk@22.1.2/overlay-prebuilt.css` (`sha384-TzjTYTjA9SdI8tFIhEs9wgQHnG7eJKh8GWty2r91PSuseI9qo8FGgiscSxcXiKNn`)

The CDK URLs deliberately use static raw FESM files rather than CDK's `+esm` endpoint. Their relative imports preserve a single Angular/CDK class and injection-token identity with the externalized peers. Because those raw CDK files contain partially compiled Angular declarations, the pinned compiler module is evaluated before the résumé graph to register Angular's runtime JIT facade. Do not replace exact versions with `latest`, ranges, or unpinned jsDelivr aliases.

### CSP and CORS

A restrictive deployment must add `https://cdn.jsdelivr.net` to all of these policies:

| CSP directive | Required operation                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `script-src`  | Import-map-resolved Angular, CDK, and RxJS modules; also authorize the inline import map itself with the deployment's nonce or hash policy. |
| `style-src`   | The CDK overlay stylesheet.                                                                                                                 |
| `connect-src` | Anonymous CORS `HEAD` availability checks for every mapped module URL.                                                                      |

These are additions to any allowances needed for the cdnjs PDF runtime and the image origin documented above. jsDelivr responses, and any proxy placed in front of them, must preserve successful `HEAD` handling and `Access-Control-Allow-Origin` for the anonymous cross-origin checks and module requests. The SRI-protected overlay stylesheet also loads with `crossorigin="anonymous"`; blocked CORS, a changed response body, or an integrity mismatch is treated as an outage. No request sends credentials.

### Startup retries and local fallback

Every production page load checks all 21 module entries and loads the overlay stylesheet before importing the résumé application. One initial attempt and three fixed retries use the same convention as the OpenCV loader:

| Elapsed time | Attempt | URL form         |
| ------------ | ------- | ---------------- |
| `0 ms`       | Initial | Exact pinned URL |
| `1,000 ms`   | Retry 1 | `?retry=1`       |
| `2,000 ms`   | Retry 2 | `?retry=2`       |
| `3,000 ms`   | Retry 3 | `?retry=3`       |

The policy is `retries: 3`, `delayMs: 1_000`, `delayMultiplier: 1.0`, and `jitterMs: 0`; it has no exponential backoff or random delay. Failed and in-flight resources are removed before the next attempt. A successful preflight starts the résumé, but a subsequent external module-graph or résumé bootstrap failure still switches immediately to the fallback.

After all four availability attempts fail, the loader imports the local `fallback/main.js`. This separately built Angular application contains no Material or CDK code. Its root and wildcard routes preserve the current URL and render **Website is unavailable** with a Retry button. Retry performs a full document reload, clearing browser module-failure caches and beginning a new four-attempt sequence.

Deploy `index.html`, the hashed résumé assets, and `fallback/main.js` atomically under the same web root. The fallback must remain locally available and served as JavaScript when jsDelivr is completely blocked.

Externalization reduces CDK JavaScript attributed to the local production chunks. It does not promise lower total network transfer or faster startup: raw FESM entry points are less application-tree-shaken and can add remote requests or transfer more bytes than the former bundled code.

### Coordinated dependency upgrades

Treat the npm lock graph, import map, readiness manifest, stylesheet metadata, and production external list as one release unit:

1. Update compatible Angular, Material, CDK, and RxJS npm versions and `package-lock.json`; do not remove `@angular/cdk`.
2. Update every matching URL in both `src/index.html` and `src/bootstrap/cdn-runtime-assets.ts` to those exact locked versions.
3. Recompute and update the overlay stylesheet SRI value when its version or bytes change.
4. Inspect a fresh production stats graph for added or removed external specifiers, then update `externalDependencies`, the import map, and the readiness manifest together.
5. Run both test projects and both production builds, inspect the emitted import map and stats, and verify the local fallback with jsDelivr blocked before deploying.

## Runtime OpenCV dependency

Technology-icon contrast optimization is browser-only and begins after the initial render during idle time. When optimization starts, the browser dynamically imports OpenCV from `https://cdn.jsdelivr.net/npm/@techstark/opencv-js/+esm`; OpenCV is not installed as an npm dependency or included in the application chunks.

Deployments that enforce Content Security Policy must allow `https://cdn.jsdelivr.net` in the applicable `script-src` policy. If the CDN module is unavailable, blocked, or cannot enhance an icon, the application remains usable and displays the original icon on a light background.

## Formatting and tests

```bash
npm run format
npm run format:check
npm test
npm run test:fallback
```

Prettier formats TypeScript, Angular templates, styles, JSON, and Markdown. The two test commands run the network-independent résumé and fallback Angular/Vitest suites, including navigation, Material composition, image zoom, printing, PDF, OpenCV, startup retry, unavailable-route, and reload coverage.

## Production build

```bash
npm run build
```

The production command first builds the CDN-externalized résumé and then the local fallback application. It emits neither a generated résumé PDF nor bundled or lazy `pdfmake`/virtual-font runtime chunks, and its `index.html` contains no eager cdnjs script tag, preconnect, or preload for them. The first PDF-runtime request occurs only after a user activates a Download PDF control.

Upload the contents of this directory to a web root:

```text
dist/resume/browser/
```

The output is host-neutral and requires no backend, runtime API, route rewrites, or server-side rendering. The production résumé requires jsDelivr unless it is displaying the local unavailable fallback.

## Useful scripts

| Command                  | Purpose                                                |
| ------------------------ | ------------------------------------------------------ |
| `npm start`              | Run the network-independent résumé development server. |
| `npm run watch`          | Continuously create local résumé development builds.   |
| `npm run build`          | Build the production résumé and its local fallback.    |
| `npm run build:fallback` | Build only the stable local fallback bundle.           |
| `npm test`               | Run the résumé Angular/Vitest suite once.              |
| `npm run test:fallback`  | Run the isolated fallback Angular/Vitest suite once.   |
| `npm run format`         | Format the project with Prettier.                      |
| `npm run format:check`   | Verify formatting without changing files.              |
