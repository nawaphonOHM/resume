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
});
pdfmake.setUrlAccessPolicy(() => false);
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
  const requiredLinks = [`mailto:${profile.details.email}`, ...profile.links.map(({ url }) => url)];

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
