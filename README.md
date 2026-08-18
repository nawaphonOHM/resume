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

Activating either Download PDF control generates the résumé directly from the canonical typed résumé data. The first request dynamically imports the browser build of `pdfmake` and its bundled virtual-file-system fonts; those modules remain outside the initial application bundle and are reused for later requests.

Before starting the download, the application verifies the PDF header, minimum size, required links, content safeguards, and absence of phone or `tel:` data. Installation, production builds, and initial page loads perform no PDF generation.

## Runtime OpenCV dependency

Technology-icon contrast optimization is browser-only and begins after the initial render during idle time. When optimization starts, the browser dynamically imports OpenCV from `https://cdn.jsdelivr.net/npm/@techstark/opencv-js@5/+esm`; OpenCV is not installed as an npm dependency or included in the application chunks.

Deployments that enforce Content Security Policy must allow `https://cdn.jsdelivr.net` in the applicable `script-src` policy. If the CDN module is unavailable, blocked, or cannot enhance an icon, the application remains usable and displays the original icon on a light background.

## Formatting and tests

```bash
npm run format
npm run format:check
npm test
```

Prettier formats TypeScript, Angular templates, styles, JSON, and Markdown. The test command runs the Angular/Vitest suite, including the PDF document, privacy, lazy-loading, download, and retry coverage.

## Production build

```bash
npm run build
```

The production command compiles only the Angular application. It emits no generated résumé PDF; `pdfmake` and its fonts remain lazy browser chunks that load only after a user requests a download.

Upload the contents of this directory to a web root:

```text
dist/resume/browser/
```

The output is host-neutral and requires no backend, runtime API, route rewrites, or server-side rendering.

## Useful scripts

| Command                | Purpose                                         |
| ---------------------- | ----------------------------------------------- |
| `npm start`            | Run the Angular development server.             |
| `npm run watch`        | Continuously create development builds.         |
| `npm run build`        | Produce the static Angular deployment artifact. |
| `npm test`             | Run the Angular/Vitest test suite once.         |
| `npm run format`       | Format the project with Prettier.               |
| `npm run format:check` | Verify formatting without changing files.       |
