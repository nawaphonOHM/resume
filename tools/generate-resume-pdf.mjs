import { createReadStream, existsSync } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import puppeteer from 'puppeteer';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const browserDirectory = resolve(projectRoot, 'dist/resume/browser');
const outputPath = resolve(projectRoot, 'public/downloads/nawaphon-isarathanachaikul-resume.pdf');
const requiredText = [
  'Professional summary',
  'Accord Innovations',
  'Saitech Solution',
  'Nityo Infotech',
  'LINE MAN Wongnai',
  'WiseSoft',
  'Core skills',
  'Available on request',
];
const phonePattern = /(?:\+?66|0[689])[\s().-]*(?:\d[\s().-]*){8}/;
const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

if (!existsSync(resolve(browserDirectory, 'index.html'))) {
  throw new Error(
    'The browser build is missing. Run "npm run build:app" before generating the PDF.',
  );
}

await mkdir(dirname(outputPath), { recursive: true });

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
    const relativePath = requestUrl.pathname === '/' ? 'index.html' : requestUrl.pathname.slice(1);
    const filePath = resolve(browserDirectory, decodeURIComponent(relativePath));

    if (!filePath.startsWith(`${browserDirectory}${sep}`)) {
      response.writeHead(403).end('Forbidden');
      return;
    }

    const file = await stat(filePath);
    if (!file.isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }

    response.writeHead(200, {
      'Content-Type': contentTypes.get(extname(filePath)) ?? 'application/octet-stream',
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404).end('Not found');
  }
});

await new Promise((resolveServer, rejectServer) => {
  server.once('error', rejectServer);
  server.listen(0, '127.0.0.1', resolveServer);
});

const address = server.address();
if (!address || typeof address === 'string') {
  throw new Error('Unable to determine the local PDF rendering server address.');
}

let browser;

try {
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${address.port}/`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#profile');
  await page.emulateMediaType('print');
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.dispatchEvent(new Event('beforeprint'));
  });

  const renderedPage = await page.evaluate(() => ({
    text: document.body.innerText,
    telephoneLinks: Array.from(document.querySelectorAll('a[href^="tel:"]')).map((link) =>
      link.getAttribute('href'),
    ),
  }));

  const normalizedText = renderedPage.text.toLocaleLowerCase('en');

  for (const text of requiredText) {
    if (!normalizedText.includes(text.toLocaleLowerCase('en'))) {
      throw new Error(`The print view is missing required text: ${text}`);
    }
  }

  if (renderedPage.telephoneLinks.length > 0 || phonePattern.test(renderedPage.text)) {
    throw new Error('The print view contains phone data and cannot be published.');
  }

  const pdf = await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
  });

  if (pdf.byteLength < 50_000) {
    throw new Error(`Generated PDF is unexpectedly small (${pdf.byteLength} bytes).`);
  }

  console.log(`Generated ${outputPath} (${pdf.byteLength} bytes).`);
} finally {
  await browser?.close();
  await new Promise((resolveServer) => server.close(resolveServer));
}
