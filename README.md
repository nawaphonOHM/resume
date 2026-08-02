# Nawaphon Isarathanachaikul — Résumé Portfolio

A public Angular single-page résumé built with Angular Material and Tailwind CSS. It includes responsive section navigation, remembered light and dark themes, browser-print styling, and a reproducible phone-redacted PDF download.

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

All publishable résumé facts live in `src/app/resume/resume.data.ts` and conform to the contracts in `src/app/resume/resume.model.ts`. Update that data source rather than duplicating content in component templates.

The phone value must remain `Available on request`. Do not add a phone number, a `tel:` link, or the private source PDF anywhere under the project.

## Formatting and tests

```bash
npm run format
npm run format:check
npm test
```

Prettier formats TypeScript, Angular templates, styles, JSON, and Markdown. The test command runs both the Angular suite and the PDF generator regression suite.

## Regenerate the redacted PDF

```bash
npm run pdf
```

This command runs `tools/generate-resume-pdf.mjs`, which imports the same typed résumé data used by Angular and writes:

```text
public/downloads/nawaphon-isarathanachaikul-resume.pdf
```

The generator uses the pure-JavaScript `pdfmake` library and standard PDF fonts. It does not launch a browser or require browser-related host libraries, so the build works on managed platforms such as DigitalOcean App Platform.

Before writing the artifact, the generator verifies content parity with `resume.data.ts`, rejects phone-like data, `tel:` links, and non-HTTPS external links, and validates the PDF header, minimum size, and link annotations. `npm run pdf:generate` is an equivalent explicit command.

## Production build

```bash
npm run build
```

The public build performs these operations in order:

1. Generate the redacted PDF directly from the typed résumé data.
2. Compile the Angular application once so the PDF is included in the final static artifact.

Upload the contents of this directory to a web root:

```text
dist/resume/browser/
```

The output is host-neutral and requires no backend, runtime API, route rewrites, or server-side rendering.

## Useful scripts

| Command                | Purpose                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| `npm start`            | Run the Angular development server.                                  |
| `npm run watch`        | Continuously create development builds.                              |
| `npm run build:app`    | Create one Angular production build without regenerating the PDF.    |
| `npm run pdf`          | Regenerate the redacted PDF without building or launching a browser. |
| `npm run build`        | Produce the complete static handoff, including the latest PDF.       |
| `npm test`             | Run the Angular and PDF generator test suites once.                  |
| `npm run test:app`     | Run the Angular test suite.                                          |
| `npm run test:pdf`     | Run the PDF portability, content, and privacy tests.                 |
| `npm run format`       | Format the project with Prettier.                                    |
| `npm run format:check` | Verify formatting without changing files.                            |
