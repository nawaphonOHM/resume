# GitRanks Playwright session export

`gitranks-playwright-session.mjs` contains the recorded Playwright callbacks and a small standalone runner. The original checks used Playwright MCP's shared `page`; the runner recreates that page and executes the successful checks in the same order. The initial WCAG-tagged audit is also exported, but is not run by the runner: it originally failed because axe-core had not yet been loaded.

## Run

1. Make sure the application can reach its configured résumé API (the default uses the same origin). The application does not bundle profile data. The original session displayed a fictional profile; no API fixture or request interception is included in this export. The badge image must also load before the script can dispatch its simulated error.
2. Install Playwright separately without changing the project's dependency declarations, then install its Chromium browser:

   ```sh
   npm install --no-save --package-lock=false playwright
   npx playwright install chromium
   ```

3. Start the app using your API-enabled setup, for example `npm run start -- --host 127.0.0.1 --port 4317`. In another terminal run:

   ```sh
   node scripts/gitranks-playwright-session.mjs
   ```

   Set `RESUME_URL` to use a different app URL. To use an existing Chromium-compatible executable instead of Playwright's browser, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its path. The script loads axe-core 4.10.3 from cdnjs, so that URL must be reachable.

The runner prints JSON observations. It dispatches an image error and leaves the badge in its fallback state for the later audits; it does not save screenshots or a print PDF. The layout and contrast calculations are diagnostic only, and the script does **not** fail on AXE violations. Review reported violations and incomplete checks manually; a successful exit does not establish WCAG compliance. Theme transitions and network/image availability can affect the results.

The named exports accept a Playwright `page` for individual use. Call `loadAxe` before any AXE check, and call `inspectPrintAndFailure` before `inspectFallbackContrast`; the latter expects the fallback element to be present. The original `initialWcagAudit` requires axe-core too, despite failing without it in the recorded session.
