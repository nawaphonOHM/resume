import { RESUME } from '../../data/resume/resume.data';
import type { ResumeProfile } from '../../helper/resume-profile/resume-profile.interface.ts';
import {
  buildResumeDocumentDefinition,
  validateResumePdfBytes,
  validateResumeProfile,
} from './resume-pdf-document';

const METADATA_DATE = '2026-01-01T00:00:00.000Z';

function collectProperty(value: unknown, propertyName: string): string[] {
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

function expectedResumeText(profile: ResumeProfile): string[] {
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
      experience.employmentTypes.join(' → '),
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

function pdfBytes(body: string, header = '%PDF-1.7'): Uint8Array {
  return new TextEncoder().encode(`${header}\n${body}`.padEnd(10_001, 'x'));
}

function validPdfBytes(additionalText = ''): Uint8Array {
  return pdfBytes(
    [
      `mailto:${RESUME.details.email}`,
      RESUME.education.seniorProject.url,
      ...RESUME.links.map(({ url }) => url),
      additionalText,
    ].join('\n'),
  );
}

describe('resume-profile PDF document definition', () => {
  it('contains every résumé fact and only safe links', () => {
    const definition = buildResumeDocumentDefinition(RESUME);
    const documentText = collectProperty(definition, 'text').join('\n');
    const documentLinks = collectProperty(definition, 'link');
    const expectedEmploymentLabels = RESUME.experience.map(({ employmentTypes }) =>
      employmentTypes.join(' → '),
    );
    const renderedEmploymentLabels = collectProperty(definition, 'text').filter((text) =>
      expectedEmploymentLabels.includes(text),
    );
    const sectionHeadings = definition.content
      .filter(({ headlineLevel }) => headlineLevel === 1)
      .map(({ text }) => text);

    for (const expectedText of expectedResumeText(RESUME)) {
      expect(documentText, `Missing PDF text: ${expectedText}`).toContain(expectedText);
    }

    for (const expectedText of ['Education', 'GPAX', 'Senior project:', 'View source code']) {
      expect(documentText, `Missing PDF education text: ${expectedText}`).toContain(expectedText);
    }

    expect(renderedEmploymentLabels).toEqual(expectedEmploymentLabels);
    expect(sectionHeadings).toEqual([
      'Professional summary',
      'Experience',
      'Education',
      'Core skills',
      'Profile details',
      'Links',
    ]);
    expect(new Set(documentLinks)).toEqual(
      new Set([
        `mailto:${RESUME.details.email}`,
        RESUME.education.seniorProject.url,
        ...RESUME.links.map(({ url }) => url),
      ]),
    );
    expect(documentLinks.join('\n')).not.toMatch(/^tel:/im);
  });

  it('uses deterministic metadata and browser VFS font names', () => {
    const firstDefinition = buildResumeDocumentDefinition(RESUME);
    const secondDefinition = buildResumeDocumentDefinition(RESUME);

    expect(firstDefinition.info).toEqual({
      title: `${RESUME.name} — ${RESUME.title}`,
      author: RESUME.name,
      subject: `${RESUME.title} résumé`,
      keywords: 'Full Stack Developer, résumé, portfolio',
      creator: 'Nawaphon Isarathanachaikul résumé build',
      producer: 'pdfmake',
      creationDate: new Date(METADATA_DATE),
      modDate: new Date(METADATA_DATE),
    });
    expect(JSON.stringify(firstDefinition)).toBe(JSON.stringify(secondDefinition));
    expect(new Set(collectProperty(firstDefinition, 'font'))).toEqual(new Set(['Roboto']));
  });

  it('pads an incomplete final skills row', () => {
    const expandedProfile: ResumeProfile = {
      ...RESUME,
      skills: [...RESUME.skills, 'TypeScript'],
    };
    const definition = buildResumeDocumentDefinition(expandedProfile);
    const skillsHeadingIndex = definition.content.findIndex(({ text }) => text === 'Core skills');
    const skillsTable = definition.content[skillsHeadingIndex + 1]?.table;

    expect(skillsTable).toBeDefined();
    expect(skillsTable?.body.at(-1)?.map(({ text }) => text)).toEqual(['TypeScript', '', '']);
  });
});

describe('résumé profile validation', () => {
  it('accepts the canonical profile', () => {
    expect(() => validateResumeProfile(RESUME)).not.toThrow();
  });

  it('rejects phone data, telephone links, and insecure external links', () => {
    const phoneProfile = {
      ...RESUME,
      details: { ...RESUME.details, phoneLabel: ['08', '1 234 5678'].join('') },
    };
    expect(() => validateResumeProfile(phoneProfile)).toThrow(/phone/i);

    const embeddedPhoneProfile = {
      ...RESUME,
      summary: [...RESUME.summary, `Call ${['08', '1 234 5678'].join('')}`],
    };
    expect(() => validateResumeProfile(embeddedPhoneProfile)).toThrow(/phone data/i);

    const telephoneLinkProfile = {
      ...RESUME,
      links: [...RESUME.links, { label: 'Phone', url: ['te', 'l:private'].join('') }],
    };
    expect(() => validateResumeProfile(telephoneLinkProfile)).toThrow(/telephone link/i);

    const insecureLinkProfile = {
      ...RESUME,
      links: [{ ...RESUME.links[0], url: 'http://example.com' }, ...RESUME.links.slice(1)],
    };
    expect(() => validateResumeProfile(insecureLinkProfile)).toThrow(/HTTPS/i);

    const invalidLinkProfile = {
      ...RESUME,
      links: [{ ...RESUME.links[0], url: 'not a URL' }, ...RESUME.links.slice(1)],
    };
    expect(() => validateResumeProfile(invalidLinkProfile)).toThrow(/link is invalid/i);
  });

  it('rejects incomplete résumé content', () => {
    expect(() => validateResumeProfile({ ...RESUME, summary: [] })).toThrow(/summary/i);
  });

  it('requires supported employment types for every experience', () => {
    const missingEmploymentTypesProfile = {
      ...RESUME,
      experience: [
        { ...RESUME.experience[0], employmentTypes: undefined },
        ...RESUME.experience.slice(1),
      ],
    };
    expect(() => validateResumeProfile(missingEmploymentTypesProfile)).toThrow(
      /experience\[0\]\.employmentTypes.*at least one item/i,
    );

    const emptyEmploymentTypesProfile = {
      ...RESUME,
      experience: [
        RESUME.experience[0],
        { ...RESUME.experience[1], employmentTypes: [] },
        ...RESUME.experience.slice(2),
      ],
    };
    expect(() => validateResumeProfile(emptyEmploymentTypesProfile)).toThrow(
      /experience\[1\]\.employmentTypes.*at least one item/i,
    );

    const unsupportedEmploymentTypeProfile = {
      ...RESUME,
      experience: [
        RESUME.experience[0],
        RESUME.experience[1],
        { ...RESUME.experience[2], employmentTypes: ['Contract', 'Freelance'] },
        ...RESUME.experience.slice(3),
      ],
    };
    expect(() => validateResumeProfile(unsupportedEmploymentTypeProfile)).toThrow(
      /experience\[2\]\.employmentTypes\[1\].*supported/i,
    );
  });

  it('requires every education and senior-project field', () => {
    expect(() => validateResumeProfile({ ...RESUME, education: undefined })).toThrow(
      /education.*required/i,
    );

    for (const fieldName of ['degree', 'institution', 'period', 'gpax'] as const) {
      const incompleteEducationProfile = {
        ...RESUME,
        education: { ...RESUME.education, [fieldName]: ' ' },
      };
      expect(() => validateResumeProfile(incompleteEducationProfile)).toThrow(
        new RegExp(`education\\.${fieldName}`, 'i'),
      );
    }

    const missingProjectProfile = {
      ...RESUME,
      education: { ...RESUME.education, seniorProject: undefined },
    };
    expect(() => validateResumeProfile(missingProjectProfile)).toThrow(
      /education.*seniorProject.*required/i,
    );

    for (const fieldName of ['name', 'url'] as const) {
      const incompleteProjectProfile = {
        ...RESUME,
        education: {
          ...RESUME.education,
          seniorProject: { ...RESUME.education.seniorProject, [fieldName]: '' },
        },
      };
      expect(() => validateResumeProfile(incompleteProjectProfile)).toThrow(
        new RegExp(`education\\.seniorProject\\.${fieldName}`, 'i'),
      );
    }
  });

  it('rejects invalid or insecure senior-project URLs', () => {
    const invalidProjectLinkProfile = {
      ...RESUME,
      education: {
        ...RESUME.education,
        seniorProject: { ...RESUME.education.seniorProject, url: 'not a URL' },
      },
    };
    expect(() => validateResumeProfile(invalidProjectLinkProfile)).toThrow(
      /project link is invalid/i,
    );

    const insecureProjectLinkProfile = {
      ...RESUME,
      education: {
        ...RESUME.education,
        seniorProject: {
          ...RESUME.education.seniorProject,
          url: 'http://example.com/CoEChatBot',
        },
      },
    };
    expect(() => validateResumeProfile(insecureProjectLinkProfile)).toThrow(
      /project link must use HTTPS/i,
    );
  });
});

describe('generated résumé PDF byte validation', () => {
  it('accepts a sufficiently large PDF with all required annotations', () => {
    expect(() => validateResumePdfBytes(validPdfBytes(), RESUME)).not.toThrow();
  });

  it('rejects non-PDF and unexpectedly small output', () => {
    expect(() => validateResumePdfBytes(new ArrayBuffer(10_001), RESUME)).toThrow(
      /not a PDF document/i,
    );
    expect(() => validateResumePdfBytes(pdfBytes('', 'not-pdf'), RESUME)).toThrow(
      /not a PDF document/i,
    );
    expect(() => validateResumePdfBytes(new TextEncoder().encode('%PDF-1.7'), RESUME)).toThrow(
      /unexpectedly small/i,
    );
  });

  it('rejects missing links and telephone annotations', () => {
    const missingProjectLink = pdfBytes(
      [`mailto:${RESUME.details.email}`, ...RESUME.links.map(({ url }) => url)].join('\n'),
    );
    expect(() => validateResumePdfBytes(missingProjectLink, RESUME)).toThrow(
      /missing a link annotation/i,
    );
    expect(() => validateResumePdfBytes(validPdfBytes('tel:private'), RESUME)).toThrow(
      /telephone link/i,
    );
  });
});
