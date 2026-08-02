import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { RESUME } from '../src/app/resume/resume.data.ts';
import { createResumePdfBuffer } from './resume-pdf.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = resolve(projectRoot, 'public/downloads/nawaphon-isarathanachaikul-resume.pdf');
const pdf = await createResumePdfBuffer(RESUME);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, pdf);

console.log(`Generated ${outputPath} (${pdf.byteLength} bytes).`);
