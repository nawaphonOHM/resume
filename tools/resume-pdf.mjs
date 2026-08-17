import pdfmake from 'pdfmake';

const COLORS = {
  navy: '#102a43',
  accent: '#2f80ed',
  text: '#243b53',
  muted: '#627d98',
  border: '#d9e2ec',
  surface: '#f0f4f8',
  white: '#ffffff',
};

const PHONE_PATTERN = /(?:\+?66|0[689])[\s().-]*(?:\d[\s().-]*){8}/;
const PHONE_LABEL = 'Available on request';
const MINIMUM_PDF_SIZE = 10_000;
const METADATA_DATE = '2026-01-01T00:00:00.000Z';
const EMPLOYMENT_FONT_URL = 'https://fonts.cdnfonts.com/s/108/DejaVuSansMono-Bold.ttf';
const SUPPORTED_EMPLOYMENT_TYPES = new Set(['Internship', 'Permanent', 'Contract']);
const STANDARD_FONT_NAMES = new Set([
  'Helvetica',
  'Helvetica-Bold',
  'Helvetica-Oblique',
  'Helvetica-BoldOblique',
]);

pdfmake.addFonts({
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
  EmploymentLabel: {
    normal: EMPLOYMENT_FONT_URL,
    bold: EMPLOYMENT_FONT_URL,
    italics: EMPLOYMENT_FONT_URL,
    bolditalics: EMPLOYMENT_FONT_URL,
  },
});
pdfmake.setUrlAccessPolicy((url) => url === EMPLOYMENT_FONT_URL);
pdfmake.setLocalAccessPolicy((path) => STANDARD_FONT_NAMES.has(path));

function assertNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`The résumé ${fieldName} must be a non-empty string.`);
  }
}

function assertNonEmptyStringArray(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`The résumé ${fieldName} must contain at least one item.`);
  }

  for (const [index, item] of value.entries()) {
    assertNonEmptyString(item, `${fieldName}[${index}]`);
  }
}

function assertEmploymentTypes(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`The résumé ${fieldName} must contain at least one item.`);
  }

  for (const [index, employmentType] of value.entries()) {
    if (!SUPPORTED_EMPLOYMENT_TYPES.has(employmentType)) {
      throw new Error(`The résumé ${fieldName}[${index}] must be a supported employment type.`);
    }
  }
}

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

function employmentTypeLabel(experience) {
  return experience.employmentTypes.join(' → ');
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

function sectionHeading(text) {
  return {
    text,
    style: 'sectionHeading',
    headlineLevel: 1,
    margin: [0, 18, 0, 8],
  };
}

function detailRow(label, value, link) {
  return [
    { text: label, style: 'detailLabel' },
    {
      text: value,
      ...(link ? { link, color: COLORS.accent, decoration: 'underline' } : {}),
    },
  ];
}

function experienceBlock(experience) {
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

function educationBlock(education) {
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

function skillTableRows(skills) {
  const cells = skills.map((skill) => ({
    text: skill,
    bold: true,
    color: COLORS.navy,
    fillColor: COLORS.surface,
    margin: [8, 6, 8, 6],
  }));
  const rows = [];

  for (let index = 0; index < cells.length; index += 3) {
    const row = cells.slice(index, index + 3);

    while (row.length < 3) {
      row.push({ text: '', fillColor: COLORS.surface, margin: [8, 6, 8, 6] });
    }

    rows.push(row);
  }

  return rows;
}

export function validateResumeProfile(profile) {
  if (!profile || typeof profile !== 'object') {
    throw new Error('The résumé profile is required.');
  }

  assertNonEmptyString(profile.name, 'name');
  assertNonEmptyString(profile.title, 'title');
  assertNonEmptyStringArray(profile.summary, 'summary');
  assertNonEmptyStringArray(profile.skills, 'skills');

  if (!profile.details || typeof profile.details !== 'object') {
    throw new Error('The résumé profile details are required.');
  }

  for (const [fieldName, value] of Object.entries(profile.details)) {
    assertNonEmptyString(value, `details.${fieldName}`);
  }

  if (profile.details.phoneLabel !== PHONE_LABEL) {
    throw new Error(`The résumé phone value must remain "${PHONE_LABEL}".`);
  }

  if (!profile.education || typeof profile.education !== 'object') {
    throw new Error('The résumé education is required.');
  }

  for (const fieldName of ['degree', 'institution', 'period', 'gpax']) {
    assertNonEmptyString(profile.education[fieldName], `education.${fieldName}`);
  }

  const seniorProject = profile.education.seniorProject;

  if (!seniorProject || typeof seniorProject !== 'object') {
    throw new Error('The résumé education seniorProject is required.');
  }

  assertNonEmptyString(seniorProject.name, 'education.seniorProject.name');
  assertNonEmptyString(seniorProject.url, 'education.seniorProject.url');

  let parsedProjectUrl;
  try {
    parsedProjectUrl = new URL(seniorProject.url);
  } catch {
    throw new Error(`The résumé education project link is invalid: ${seniorProject.url}`);
  }

  if (parsedProjectUrl.protocol !== 'https:') {
    throw new Error(`The résumé education project link must use HTTPS: ${seniorProject.url}`);
  }

  if (!Array.isArray(profile.links) || profile.links.length === 0) {
    throw new Error('The résumé links must contain at least one item.');
  }

  for (const [index, link] of profile.links.entries()) {
    assertNonEmptyString(link?.label, `links[${index}].label`);
    assertNonEmptyString(link?.url, `links[${index}].url`);

    if (/^tel:/i.test(link.url)) {
      throw new Error('The résumé contains a telephone link and cannot be published.');
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(link.url);
    } catch {
      throw new Error(`The résumé link is invalid: ${link.url}`);
    }

    if (parsedUrl.protocol !== 'https:') {
      throw new Error(`The résumé link must use HTTPS: ${link.url}`);
    }
  }

  if (!Array.isArray(profile.experience) || profile.experience.length === 0) {
    throw new Error('The résumé experience must contain at least one item.');
  }

  for (const [index, experience] of profile.experience.entries()) {
    for (const fieldName of ['role', 'company', 'location', 'period']) {
      assertNonEmptyString(experience?.[fieldName], `experience[${index}].${fieldName}`);
    }

    assertEmploymentTypes(experience.employmentTypes, `experience[${index}].employmentTypes`);
    assertNonEmptyStringArray(experience.highlights, `experience[${index}].highlights`);
    assertNonEmptyStringArray(experience.technologies, `experience[${index}].technologies`);
  }

  const serializedProfile = JSON.stringify(profile);

  if (PHONE_PATTERN.test(serializedProfile)) {
    throw new Error('The résumé contains phone data and cannot be published.');
  }

  if (/tel:/i.test(serializedProfile)) {
    throw new Error('The résumé contains a telephone link and cannot be published.');
  }
}

export function buildResumeDocumentDefinition(profile) {
  validateResumeProfile(profile);

  const emailLink = `mailto:${profile.details.email}`;
  const definition = {
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
      font: 'Helvetica',
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
        font: 'EmploymentLabel',
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
          { text: url, link: url, color: COLORS.accent, decoration: 'underline' },
        ],
        margin: [0, 0, 0, 5],
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

function validatePdfBuffer(pdf, profile) {
  if (!Buffer.isBuffer(pdf) || pdf.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw new Error('Generated output is not a PDF document.');
  }

  if (pdf.byteLength < MINIMUM_PDF_SIZE) {
    throw new Error(`Generated PDF is unexpectedly small (${pdf.byteLength} bytes).`);
  }

  const pdfSource = pdf.toString('latin1');
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

export async function createResumePdfBuffer(profile) {
  const definition = buildResumeDocumentDefinition(profile);
  const generatedPdf = await pdfmake.createPdf(definition).getBuffer();
  const pdf = Buffer.isBuffer(generatedPdf) ? generatedPdf : Buffer.from(generatedPdf);

  validatePdfBuffer(pdf, profile);

  return pdf;
}
