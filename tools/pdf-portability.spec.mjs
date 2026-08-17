import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const employmentFontUrl = 'https://fonts.cdnfonts.com/s/108/DejaVuSansMono-Bold.ttf';

test('the PDF generator has no browser runtime dependency', async () => {
  const packageJson = JSON.parse(await readFile(resolve(projectRoot, 'package.json'), 'utf8'));
  const packageLock = await readFile(resolve(projectRoot, 'package-lock.json'), 'utf8');
  const generatorSource = await readFile(
    resolve(projectRoot, 'tools/generate-resume-pdf.mjs'),
    'utf8',
  );
  const pdfLibrarySource = await readFile(
    resolve(projectRoot, 'tools/resume-pdf.mjs'),
    'utf8',
  ).catch(() => '');
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  assert.equal(dependencies.puppeteer, undefined);
  assert.equal(typeof dependencies.pdfmake, 'string');
  assert.equal(packageJson.scripts.build, 'npm run pdf:generate && npm run build:app');
  assert.doesNotMatch(packageLock, /node_modules\/(?:@puppeteer\/|puppeteer(?:\/|"))/);
  assert.doesNotMatch(`${generatorSource}\n${pdfLibrarySource}`, /\b(?:puppeteer|chromium)\b/i);
  assert.match(generatorSource, /resume\.data\.ts/);
});

test('the employment-label font is remote, exactly allowlisted, and not locally bundled', async () => {
  const pdfLibrarySource = await readFile(resolve(projectRoot, 'tools/resume-pdf.mjs'), 'utf8');
  const bundledFontFiles = await readdir(resolve(projectRoot, 'tools/fonts'));

  assert.ok(pdfLibrarySource.includes(`const EMPLOYMENT_FONT_URL = '${employmentFontUrl}';`));
  assert.equal(
    [...pdfLibrarySource.matchAll(/:\s*EMPLOYMENT_FONT_URL,/g)].length,
    4,
    'Every EmploymentLabel variant must use the pinned font URL.',
  );
  assert.ok(
    pdfLibrarySource.includes('pdfmake.setUrlAccessPolicy((url) => url === EMPLOYMENT_FONT_URL);'),
  );
  assert.ok(
    pdfLibrarySource.includes(
      'pdfmake.setLocalAccessPolicy((path) => STANDARD_FONT_NAMES.has(path));',
    ),
  );
  assert.doesNotMatch(pdfLibrarySource, /fileURLToPath|EMPLOYMENT_FONT_PATH|\.\/fonts\//);
  assert.deepEqual(
    bundledFontFiles.filter((fileName) => fileName.endsWith('.ttf')),
    [],
  );
});
