import type { Experience, ResumeEducation, ResumeProfile } from '../../model/resume/resume.model';

const COLORS = {
  navy: '#102a43',
  accent: '#2f80ed',
  text: '#243b53',
  muted: '#627d98',
  border: '#d9e2ec',
  surface: '#f0f4f8',
  white: '#ffffff',
} as const;

const PHONE_PATTERN = /(?:\+?66|0[689])[\s().-]*(?:\d[\s().-]*){8}/;
const PHONE_LABEL = 'Available on request';
const MINIMUM_PDF_SIZE = 10_000;
const METADATA_DATE = '2026-01-01T00:00:00.000Z';
const BROWSER_FONT = 'Roboto';
const SUPPORTED_EMPLOYMENT_TYPES = new Set<string>(['Internship', 'Permanent', 'Contract']);
const PDF_HEADER = [0x25, 0x50, 0x44, 0x46, 0x2d] as const;

type ResumePdfMargin = readonly [number, number, number, number];
type ResumePdfColumnWidth = number | '*' | 'auto';
type ResumePdfAlignment = 'left' | 'center' | 'right';

/** A pdfmake content node used by the browser-neutral résumé definition. */
export interface ResumePdfNode {
  readonly text?: string | readonly ResumePdfNode[];
  readonly style?: string;
  readonly headlineLevel?: number;
  readonly margin?: ResumePdfMargin;
  readonly columns?: readonly ResumePdfNode[];
  readonly columnGap?: number;
  readonly stack?: readonly ResumePdfNode[];
  readonly ul?: readonly ResumePdfNode[];
  readonly width?: ResumePdfColumnWidth;
  readonly bold?: boolean;
  readonly color?: string;
  readonly font?: string;
  readonly fontSize?: number;
  readonly lineHeight?: number;
  readonly link?: string;
  readonly decoration?: 'underline';
  readonly alignment?: ResumePdfAlignment;
  readonly fillColor?: string;
  readonly table?: ResumePdfTable;
  readonly layout?: 'noBorders' | ResumePdfTableLayout;
  readonly canvas?: readonly ResumePdfCanvas[];
}

/** Table data accepted by the résumé's pdfmake layout. */
export interface ResumePdfTable {
  readonly widths: readonly ResumePdfColumnWidth[];
  readonly dontBreakRows?: boolean;
  readonly body: readonly (readonly ResumePdfNode[])[];
}

/** Table callbacks accepted by the résumé's pdfmake layout. */
export interface ResumePdfTableLayout {
  readonly hLineColor?: (index: number) => string;
  readonly vLineColor?: (index: number) => string;
  readonly hLineWidth?: (index: number) => number;
  readonly vLineWidth?: (index: number) => number;
  readonly paddingLeft?: (index: number) => number;
  readonly paddingRight?: (index: number) => number;
  readonly paddingTop?: (index: number) => number;
  readonly paddingBottom?: (index: number) => number;
}

/** Vector shape used for the document's page-edge accent. */
export interface ResumePdfCanvas {
  readonly type: 'rect';
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly color: string;
}

/** Deterministic publication metadata embedded into the generated PDF. */
export interface ResumePdfInfo {
  readonly title: string;
  readonly author: string;
  readonly subject: string;
  readonly keywords: string;
  readonly creator: string;
  readonly producer: string;
  readonly creationDate: Date;
  readonly modDate: Date;
}

/** Typed document definition consumed by the lazily loaded browser pdfmake runtime. */
export interface ResumePdfDocumentDefinition {
  readonly pageSize: 'A4';
  readonly pageMargins: ResumePdfMargin;
  readonly info: ResumePdfInfo;
  readonly language: 'en';
  readonly defaultStyle: ResumePdfStyle;
  readonly styles: Readonly<Record<string, ResumePdfStyle>>;
  readonly background: (
    currentPage: number,
    pageSize: Readonly<{ width: number; height: number }>,
  ) => ResumePdfNode;
  readonly footer: (currentPage: number, pageCount: number) => ResumePdfNode;
  readonly content: readonly ResumePdfNode[];
}

/** Text styling fields used by the résumé document definition. */
export interface ResumePdfStyle {
  readonly font?: string;
  readonly fontSize?: number;
  readonly lineHeight?: number;
  readonly color?: string;
  readonly bold?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isUint8Array(value: unknown): value is Uint8Array {
  return (
    ArrayBuffer.isView(value) && Object.prototype.toString.call(value) === '[object Uint8Array]'
  );
}

function assertNonEmptyString(value: unknown, fieldName: string): asserts value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`The résumé ${fieldName} must be a non-empty string.`);
  }
}

function assertNonEmptyStringArray(
  value: unknown,
  fieldName: string,
): asserts value is readonly string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`The résumé ${fieldName} must contain at least one item.`);
  }

  for (const [index, item] of value.entries()) {
    assertNonEmptyString(item, `${fieldName}[${index}]`);
  }
}

function assertEmploymentTypes(value: unknown, fieldName: string): void {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`The résumé ${fieldName} must contain at least one item.`);
  }

  for (const [index, employmentType] of value.entries()) {
    if (typeof employmentType !== 'string' || !SUPPORTED_EMPLOYMENT_TYPES.has(employmentType)) {
      throw new Error(`The résumé ${fieldName}[${index}] must be a supported employment type.`);
    }
  }
}

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

function employmentTypeLabel(experience: Experience): string {
  return experience.employmentTypes.join(' → ');
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
      employmentTypeLabel(experience),
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

function sectionHeading(text: string): ResumePdfNode {
  return {
    text,
    style: 'sectionHeading',
    headlineLevel: 1,
    margin: [0, 18, 0, 8],
  };
}

function detailRow(label: string, value: string, link?: string): readonly ResumePdfNode[] {
  return [
    { text: label, style: 'detailLabel' },
    {
      text: value,
      ...(link ? { link, color: COLORS.accent, decoration: 'underline' as const } : {}),
    },
  ];
}

function experienceBlock(experience: Experience): ResumePdfNode {
  return {
    stack: [
      {
        columns: [
          { text: experience.role, style: 'role', width: '*' },
          { text: experience.period, style: 'period', width: 'auto' },
        ],
        columnGap: 16,
      },
      {
        text: [
          { text: experience.company, bold: true },
          { text: ` · ${experience.location}`, color: COLORS.muted },
          { text: '  ·  ', color: COLORS.muted },
          { text: employmentTypeLabel(experience), style: 'employmentType' },
        ],
        margin: [0, 2, 0, 7],
      },
      {
        ul: experience.highlights.map((text) => ({ text })),
        style: 'body',
        margin: [12, 0, 0, 6],
      },
      {
        text: [
          { text: 'Technologies  ', bold: true, color: COLORS.navy },
          { text: experience.technologies.join(' · '), color: COLORS.muted },
        ],
        style: 'technology',
      },
    ],
    margin: [0, 0, 0, 14],
  };
}

function educationBlock(education: ResumeEducation): ResumePdfNode {
  return {
    table: {
      widths: ['*'],
      dontBreakRows: true,
      body: [
        [
          {
            stack: [
              {
                columns: [
                  {
                    width: '*',
                    stack: [
                      { text: education.degree, style: 'role' },
                      {
                        text: education.institution,
                        bold: true,
                        color: COLORS.accent,
                        margin: [0, 3, 0, 0],
                      },
                    ],
                  },
                  {
                    width: 'auto',
                    stack: [
                      { text: education.period, style: 'period', alignment: 'right' },
                      {
                        text: [
                          { text: 'GPAX  ', bold: true, color: COLORS.navy },
                          { text: education.gpax },
                        ],
                        alignment: 'right',
                        margin: [0, 4, 0, 0],
                      },
                    ],
                  },
                ],
                columnGap: 16,
              },
              {
                text: [
                  { text: 'Senior project: ', bold: true, color: COLORS.navy },
                  { text: education.seniorProject.name },
                  { text: '  ·  ', color: COLORS.muted },
                  {
                    text: 'View source code',
                    link: education.seniorProject.url,
                    color: COLORS.accent,
                    decoration: 'underline',
                  },
                ],
                margin: [0, 9, 0, 0],
              },
            ],
            fillColor: COLORS.surface,
            margin: [12, 10, 12, 10],
          },
        ],
      ],
    },
    layout: {
      hLineColor: () => COLORS.border,
      vLineColor: () => COLORS.border,
      hLineWidth: () => 0.6,
      vLineWidth: () => 0.6,
    },
  };
}

function skillTableRows(skills: readonly string[]): ResumePdfNode[][] {
  const cells: ResumePdfNode[] = skills.map((skill) => ({
    text: skill,
    bold: true,
    color: COLORS.navy,
    fillColor: COLORS.surface,
    margin: [8, 6, 8, 6],
  }));
  const rows: ResumePdfNode[][] = [];

  for (let index = 0; index < cells.length; index += 3) {
    const row = cells.slice(index, index + 3);

    while (row.length < 3) {
      row.push({ text: '', fillColor: COLORS.surface, margin: [8, 6, 8, 6] });
    }

    rows.push(row);
  }

  return rows;
}

/** Validates publication-critical fields before constructing a résumé PDF. */
export function validateResumeProfile(profile: unknown): void {
  if (!isRecord(profile)) {
    throw new Error('The résumé profile is required.');
  }

  assertNonEmptyString(profile['name'], 'name');
  assertNonEmptyString(profile['title'], 'title');
  assertNonEmptyStringArray(profile['summary'], 'summary');
  assertNonEmptyStringArray(profile['skills'], 'skills');

  const details = profile['details'];
  if (!isRecord(details)) {
    throw new Error('The résumé profile details are required.');
  }

  for (const [fieldName, value] of Object.entries(details)) {
    assertNonEmptyString(value, `details.${fieldName}`);
  }

  if (details['phoneLabel'] !== PHONE_LABEL) {
    throw new Error(`The résumé phone value must remain "${PHONE_LABEL}".`);
  }

  const education = profile['education'];
  if (!isRecord(education)) {
    throw new Error('The résumé education is required.');
  }

  for (const fieldName of ['degree', 'institution', 'period', 'gpax']) {
    assertNonEmptyString(education[fieldName], `education.${fieldName}`);
  }

  const seniorProject = education['seniorProject'];
  if (!isRecord(seniorProject)) {
    throw new Error('The résumé education seniorProject is required.');
  }

  assertNonEmptyString(seniorProject['name'], 'education.seniorProject.name');
  const projectUrl = seniorProject['url'];
  assertNonEmptyString(projectUrl, 'education.seniorProject.url');

  let parsedProjectUrl: URL;
  try {
    parsedProjectUrl = new URL(projectUrl);
  } catch {
    throw new Error(`The résumé education project link is invalid: ${projectUrl}`);
  }

  if (parsedProjectUrl.protocol !== 'https:') {
    throw new Error(`The résumé education project link must use HTTPS: ${projectUrl}`);
  }

  const links = profile['links'];
  if (!Array.isArray(links) || links.length === 0) {
    throw new Error('The résumé links must contain at least one item.');
  }

  for (const [index, link] of links.entries()) {
    const label = isRecord(link) ? link['label'] : undefined;
    const url = isRecord(link) ? link['url'] : undefined;
    assertNonEmptyString(label, `links[${index}].label`);
    assertNonEmptyString(url, `links[${index}].url`);

    if (/^tel:/i.test(url)) {
      throw new Error('The résumé contains a telephone link and cannot be published.');
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error(`The résumé link is invalid: ${url}`);
    }

    if (parsedUrl.protocol !== 'https:') {
      throw new Error(`The résumé link must use HTTPS: ${url}`);
    }
  }

  const experienceEntries = profile['experience'];
  if (!Array.isArray(experienceEntries) || experienceEntries.length === 0) {
    throw new Error('The résumé experience must contain at least one item.');
  }

  for (const [index, experience] of experienceEntries.entries()) {
    const experienceRecord = isRecord(experience) ? experience : {};

    for (const fieldName of ['role', 'company', 'location', 'period']) {
      assertNonEmptyString(experienceRecord[fieldName], `experience[${index}].${fieldName}`);
    }

    assertEmploymentTypes(
      experienceRecord['employmentTypes'],
      `experience[${index}].employmentTypes`,
    );
    assertNonEmptyStringArray(experienceRecord['highlights'], `experience[${index}].highlights`);
    assertNonEmptyStringArray(
      experienceRecord['technologies'],
      `experience[${index}].technologies`,
    );
  }

  const serializedProfile = JSON.stringify(profile);

  if (PHONE_PATTERN.test(serializedProfile)) {
    throw new Error('The résumé contains phone data and cannot be published.');
  }

  if (/tel:/i.test(serializedProfile)) {
    throw new Error('The résumé contains a telephone link and cannot be published.');
  }
}

/** Builds a deterministic, browser-font-compatible pdfmake document definition. */
export function buildResumeDocumentDefinition(profile: ResumeProfile): ResumePdfDocumentDefinition {
  validateResumeProfile(profile);

  const emailLink = `mailto:${profile.details.email}`;
  const definition: ResumePdfDocumentDefinition = {
    pageSize: 'A4',
    pageMargins: [44, 48, 44, 52],
    info: {
      title: `${profile.name} — ${profile.title}`,
      author: profile.name,
      subject: `${profile.title} résumé`,
      keywords: 'Full Stack Developer, résumé, portfolio',
      creator: 'Nawaphon Isarathanachaikul résumé build',
      producer: 'pdfmake',
      creationDate: new Date(METADATA_DATE),
      modDate: new Date(METADATA_DATE),
    },
    language: 'en',
    defaultStyle: {
      font: BROWSER_FONT,
      fontSize: 9.4,
      lineHeight: 1.22,
      color: COLORS.text,
    },
    styles: {
      sectionHeading: {
        fontSize: 14,
        bold: true,
        color: COLORS.navy,
      },
      body: {
        fontSize: 9.4,
        lineHeight: 1.25,
      },
      role: {
        fontSize: 11.5,
        bold: true,
        color: COLORS.navy,
      },
      period: {
        fontSize: 8.5,
        bold: true,
        color: COLORS.accent,
      },
      employmentType: {
        font: BROWSER_FONT,
        fontSize: 8.5,
        bold: true,
        color: COLORS.accent,
      },
      detailLabel: {
        fontSize: 8.5,
        bold: true,
        color: COLORS.navy,
      },
      technology: {
        fontSize: 8.2,
        lineHeight: 1.2,
      },
    },
    background(currentPage, pageSize) {
      return {
        canvas: [
          {
            type: 'rect',
            x: 0,
            y: 0,
            w: 8,
            h: pageSize.height,
            color: currentPage === 1 ? COLORS.accent : COLORS.navy,
          },
        ],
      };
    },
    footer(currentPage, pageCount) {
      return {
        text: `${profile.name}  ·  ${currentPage} / ${pageCount}`,
        alignment: 'center',
        color: COLORS.muted,
        fontSize: 8,
        margin: [44, 16, 44, 0],
      };
    },
    content: [
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                stack: [
                  { text: profile.name, fontSize: 25, bold: true, color: COLORS.white },
                  {
                    text: profile.title,
                    fontSize: 13,
                    color: '#d9eaff',
                    margin: [0, 5, 0, 0],
                  },
                ],
                fillColor: COLORS.navy,
                margin: [24, 18, 24, 18],
              },
            ],
          ],
        },
        layout: 'noBorders',
        margin: [-36, -40, -36, 18],
      },
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: profile.details.location, bold: true, color: COLORS.navy },
              {
                text: profile.details.email,
                link: emailLink,
                color: COLORS.accent,
                decoration: 'underline',
                margin: [0, 3, 0, 0],
              },
            ],
          },
          {
            width: 'auto',
            text: profile.details.phoneLabel,
            bold: true,
            color: COLORS.muted,
            alignment: 'right',
          },
        ],
        columnGap: 20,
        margin: [0, 0, 0, 2],
      },
      sectionHeading('Professional summary'),
      {
        ul: profile.summary.map((text) => ({ text })),
        style: 'body',
        margin: [12, 0, 0, 2],
      },
      sectionHeading('Experience'),
      ...profile.experience.map(experienceBlock),
      sectionHeading('Education'),
      educationBlock(profile.education),
      sectionHeading('Core skills'),
      {
        table: {
          widths: ['*', '*', '*'],
          body: skillTableRows(profile.skills),
        },
        layout: {
          hLineColor: () => COLORS.border,
          vLineColor: () => COLORS.border,
          hLineWidth: () => 0.6,
          vLineWidth: () => 0.6,
        },
      },
      sectionHeading('Profile details'),
      {
        table: {
          widths: [90, '*'],
          body: [
            detailRow('Location', profile.details.location),
            detailRow('Phone', profile.details.phoneLabel),
            detailRow('Email', profile.details.email, emailLink),
            detailRow('Nationality', profile.details.nationality),
            detailRow('Date of birth', profile.details.birthDate),
          ],
        },
        layout: {
          hLineColor: () => COLORS.border,
          vLineWidth: () => 0,
          hLineWidth: (index) => (index === 0 ? 0 : 0.5),
          paddingLeft: () => 0,
          paddingRight: () => 8,
          paddingTop: () => 5,
          paddingBottom: () => 5,
        },
      },
      sectionHeading('Links'),
      ...profile.links.map(({ label, url }) => ({
        text: [
          { text: `${label}: `, bold: true, color: COLORS.navy },
          { text: url, link: url, color: COLORS.accent, decoration: 'underline' as const },
        ],
        margin: [0, 0, 0, 5] as const,
      })),
    ],
  };

  const documentText = collectProperty(definition, 'text').join('\n');

  for (const requiredText of expectedResumeText(profile)) {
    if (!documentText.includes(requiredText)) {
      throw new Error(`The PDF document definition is missing résumé text: ${requiredText}`);
    }
  }

  return definition;
}

/** Validates generated PDF bytes before browser download side effects occur. */
export function validateResumePdfBytes(
  pdf: unknown,
  profile: ResumeProfile,
): asserts pdf is Uint8Array {
  if (!isUint8Array(pdf) || PDF_HEADER.some((expectedByte, index) => pdf[index] !== expectedByte)) {
    throw new Error('Generated output is not a PDF document.');
  }

  if (pdf.byteLength < MINIMUM_PDF_SIZE) {
    throw new Error(`Generated PDF is unexpectedly small (${pdf.byteLength} bytes).`);
  }

  const pdfSource = new TextDecoder('latin1').decode(pdf);
  const requiredLinks = [
    `mailto:${profile.details.email}`,
    profile.education.seniorProject.url,
    ...profile.links.map(({ url }) => url),
  ];

  for (const requiredLink of requiredLinks) {
    if (!pdfSource.includes(requiredLink)) {
      throw new Error(`Generated PDF is missing a link annotation: ${requiredLink}`);
    }
  }

  if (/tel:/i.test(pdfSource)) {
    throw new Error('Generated PDF contains a telephone link and cannot be published.');
  }
}
