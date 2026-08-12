import assert from 'node:assert/strict';
import test from 'node:test';

import { RESUME } from '../src/app/data/resume/resume.data.ts';
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
    profile.education.degree,
    profile.education.institution,
    profile.education.period,
    profile.education.gpax,
    profile.education.seniorProject.name,
  ];
}

test('the document definition contains every résumé fact and only safe links', () => {
  const definition = buildResumeDocumentDefinition(RESUME);
  const documentText = collectProperty(definition, 'text').join('\n');
  const documentLinks = collectProperty(definition, 'link');
  const sectionHeadings = definition.content
    .filter(({ headlineLevel }) => headlineLevel === 1)
    .map(({ text }) => text);

  for (const expectedText of expectedResumeText(RESUME)) {
    assert.ok(documentText.includes(expectedText), `Missing PDF text: ${expectedText}`);
  }

  for (const expectedText of ['Education', 'GPAX', 'Senior project:', 'View source code']) {
    assert.ok(documentText.includes(expectedText), `Missing PDF education text: ${expectedText}`);
  }

  assert.deepEqual(sectionHeadings, [
    'Professional summary',
    'Experience',
    'Education',
    'Core skills',
    'Profile details',
    'Links',
  ]);
  assert.deepEqual(
    new Set(documentLinks),
    new Set([
      `mailto:${RESUME.details.email}`,
      RESUME.education.seniorProject.url,
      ...RESUME.links.map(({ url }) => url),
    ]),
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

  const expectedExternalLinks = [
    RESUME.education.seniorProject.url,
    ...RESUME.links.map(({ url }) => url),
  ];

  for (const url of expectedExternalLinks) {
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

test('validation requires every education and senior-project field', () => {
  const missingEducationProfile = structuredClone(RESUME);
  delete missingEducationProfile.education;

  assert.throws(() => validateResumeProfile(missingEducationProfile), /education.*required/i);

  for (const fieldName of ['degree', 'institution', 'period', 'gpax']) {
    const incompleteEducationProfile = structuredClone(RESUME);
    incompleteEducationProfile.education[fieldName] = ' ';

    assert.throws(
      () => validateResumeProfile(incompleteEducationProfile),
      new RegExp(`education\\.${fieldName}`, 'i'),
    );
  }

  const missingProjectProfile = structuredClone(RESUME);
  delete missingProjectProfile.education.seniorProject;

  assert.throws(
    () => validateResumeProfile(missingProjectProfile),
    /education.*seniorProject.*required/i,
  );

  for (const fieldName of ['name', 'url']) {
    const incompleteProjectProfile = structuredClone(RESUME);
    incompleteProjectProfile.education.seniorProject[fieldName] = '';

    assert.throws(
      () => validateResumeProfile(incompleteProjectProfile),
      new RegExp(`education\\.seniorProject\\.${fieldName}`, 'i'),
    );
  }
});

test('validation rejects invalid or insecure senior-project URLs', () => {
  const invalidProjectLinkProfile = structuredClone(RESUME);
  invalidProjectLinkProfile.education.seniorProject.url = 'not a URL';

  assert.throws(() => validateResumeProfile(invalidProjectLinkProfile), /project link is invalid/i);

  const insecureProjectLinkProfile = structuredClone(RESUME);
  insecureProjectLinkProfile.education.seniorProject.url = 'http://example.com/CoEChatBot';

  assert.throws(
    () => validateResumeProfile(insecureProjectLinkProfile),
    /project link must use HTTPS/i,
  );
});

test('PDF generation pads an incomplete final skills row', async () => {
  const expandedProfile = structuredClone(RESUME);
  expandedProfile.skills.push('TypeScript');

  const pdf = await createResumePdfBuffer(expandedProfile);

  assert.equal(pdf.subarray(0, 5).toString('ascii'), '%PDF-');
});
