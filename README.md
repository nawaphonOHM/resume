# Nawaphon Isarathanachaikul — Résumé Portfolio

A public Angular single-page résumé built with Angular Material and Tailwind CSS. It includes responsive section navigation, remembered light and dark themes, browser-print styling, and a reproducible phone-redacted PDF download.

## Requirements

- Node.js 22
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
npm test -- --watch=false
```

Prettier formats TypeScript, Angular templates, styles, JSON, and Markdown.

## Regenerate the redacted PDF

```bash
npm run pdf
```

This command creates a production browser build and then runs `tools/generate-resume-pdf.mjs`. Puppeteer renders the same Angular print view used by the website and writes:

```text
public/downloads/nawaphon-isarathanachaikul-resume.pdf
```

The generator validates required content, rejects phone-like data and `tel:` links, and fails if the PDF is unexpectedly small. To run only the generator against an existing browser build, use `npm run pdf:generate`.

## Production build

```bash
npm run build
```

The public build performs these operations in order:

1. Compile the Angular application.
2. Generate the redacted PDF from that compiled page.
3. Compile again so the generated PDF is included in the final static artifact.

Upload the contents of this directory to a web root:

```text
dist/resume/browser/
```

The output is host-neutral and requires no backend, runtime API, route rewrites, or server-side rendering.

## Useful scripts

| Command                     | Purpose                                                           |
| --------------------------- | ----------------------------------------------------------------- |
| `npm start`                 | Run the Angular development server.                               |
| `npm run watch`             | Continuously create development builds.                           |
| `npm run build:app`         | Create one Angular production build without regenerating the PDF. |
| `npm run pdf`               | Build the page and regenerate the redacted PDF.                   |
| `npm run build`             | Produce the complete static handoff, including the latest PDF.    |
| `npm test -- --watch=false` | Run the Vitest suite once.                                        |
| `npm run format`            | Format the project with Prettier.                                 |
| `npm run format:check`      | Verify formatting without changing files.                         |
