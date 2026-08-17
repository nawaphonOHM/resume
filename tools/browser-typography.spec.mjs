import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const GLOBAL_STYLES_URL = new URL('../src/styles.scss', import.meta.url);
const MATERIAL_THEME_URL = new URL('../src/material-theme.scss', import.meta.url);

const [globalStyles, materialTheme] = await Promise.all([
  readFile(GLOBAL_STYLES_URL, 'utf8'),
  readFile(MATERIAL_THEME_URL, 'utf8'),
]);

test('global browser typography uses the CDN family with a bold monospace fallback', () => {
  assert.match(
    globalStyles,
    /@import url\('https:\/\/fonts\.cdnfonts\.com\/css\/dejavu-sans-mono'\);/,
  );
  assert.match(globalStyles, /--font-sans: 'DejaVu Sans Mono', monospace;/);
  assert.match(globalStyles, /body\s*{[^}]*font-family: var\(--font-sans\);/s);
  assert.match(globalStyles, /body\s*{[^}]*font-weight: 700;/s);
  assert.doesNotMatch(globalStyles, /system-ui/);
});

test('Angular Material typography uses the same bold monospace family', () => {
  assert.doesNotMatch(materialTheme, /system-ui/);
  assert.equal(materialTheme.match(/'DejaVu Sans Mono',\s*monospace/g)?.length, 2);
  assert.equal(materialTheme.match(/-weight: 700/g)?.length, 3);
});

test('global styles retain the dedicated Material Icons font stylesheet', () => {
  assert.match(globalStyles, /@import 'material-icons\/iconfont\/material-icons\.css';/);
});
