import assert from 'node:assert/strict';
import test from 'node:test';

import { RESUME } from '../src/app/resume/resume.data.ts';
import {
  buildResumeDocumentDefinition,
  createResumePdfBuffer,
  validateResumeProfile,
} from './resume-pdf.mjs';

function collectProperty(value, propertyName) {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectProperty(entry, propertyName));
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  return Object.entries(value).flatMap(([key, entry]) => [
    ...(key === propertyName && typeof entry === 'string' ? [entry] : []),
    ...collectProperty(entry, propertyName),
  ]);
}

function expectedResumeText(profile) {
  return [
    profile.name,
    profile.title,
    ...profile.summary,
    ...Object.values(profile.details),
    ...profile.links.flatMap(({ label, url }) => [label, url]),
    ...profile.skills,
    ...profile.experience.flatMap((experience) => [
      experience.role,
      experience.company,
      experience.location,
      experience.period,
      ...experience.highlights,
      ...experience.technologies,
    ]),
  ];
}

test('the document definition contains every résumé fact and only safe links', () => {
  const definition = buildResumeDocumentDefinition(RESUME);
  const documentText = collectProperty(definition, 'text').join('\n');
  const documentLinks = collectProperty(definition, 'link');

  for (const expectedText of expectedResumeText(RESUME)) {
    assert.ok(documentText.includes(expectedText), `Missing PDF text: ${expectedText}`);
  }

  assert.deepEqual(
    new Set(documentLinks),
    new Set([`mailto:${RESUME.details.email}`, ...RESUME.links.map(({ url }) => url)]),
  );
  assert.doesNotMatch(documentLinks.join('\n'), /^tel:/im);
});

test('PDF generation is deterministic and retains its link annotations', async () => {
  const firstPdf = await createResumePdfBuffer(RESUME);
  const secondPdf = await createResumePdfBuffer(RESUME);
  const pdfSource = firstPdf.toString('latin1');

  assert.equal(firstPdf.subarray(0, 5).toString('ascii'), '%PDF-');
  assert.ok(firstPdf.byteLength > 10_000);
  assert.deepEqual(firstPdf, secondPdf);
  assert.match(pdfSource, new RegExp(`mailto:${RESUME.details.email}`));

  for (const { url } of RESUME.links) {
    assert.ok(pdfSource.includes(url), `Missing PDF link annotation: ${url}`);
  }

  assert.doesNotMatch(pdfSource, /tel:/i);
});

test('validation rejects phone data, telephone links, and insecure external links', () => {
  const phoneProfile = structuredClone(RESUME);
  phoneProfile.details.phoneLabel = ['08', '1 234 5678'].join('');

  assert.throws(() => validateResumeProfile(phoneProfile), /phone/i);

  const embeddedPhoneProfile = structuredClone(RESUME);
  embeddedPhoneProfile.summary.push(`Call ${['08', '1 234 5678'].join('')}`);

  assert.throws(() => validateResumeProfile(embeddedPhoneProfile), /phone data/i);

  const telephoneLinkProfile = structuredClone(RESUME);
  telephoneLinkProfile.links.push({ label: 'Phone', url: ['te', 'l:private'].join('') });

  assert.throws(() => validateResumeProfile(telephoneLinkProfile), /telephone link/i);

  const insecureLinkProfile = structuredClone(RESUME);
  insecureLinkProfile.links[0].url = 'http://example.com';

  assert.throws(() => validateResumeProfile(insecureLinkProfile), /HTTPS/i);
});

test('validation rejects incomplete résumé content', () => {
  const incompleteProfile = structuredClone(RESUME);
  incompleteProfile.summary = [];

  assert.throws(() => validateResumeProfile(incompleteProfile), /summary/i);
});

test('PDF generation pads an incomplete final skills row', async () => {
  const expandedProfile = structuredClone(RESUME);
  expandedProfile.skills.push('TypeScript');

  const pdf = await createResumePdfBuffer(expandedProfile);

  assert.equal(pdf.subarray(0, 5).toString('ascii'), '%PDF-');
});
