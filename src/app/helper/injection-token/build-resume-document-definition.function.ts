import { inject, InjectionToken } from '@angular/core';
import type { ResumeProfile } from '../interface/resume-profile/resume-profile.interface.ts';
import type { ResumePdfDocumentDefinition } from '../interface/resume-pdf-document-definition/resume-pdf-document-definition.interface.ts';
import { validateResumeProfile } from './validate-resume-profile.function.ts';
import { COLORS } from './colors.variable.ts';
import { METADATA_DATE } from './metadata-date-variable.ts';
import { BROWSER_FONT } from './bowser-font-variable.ts';
import type { COLOR_TYPE } from '../type/colors.type.ts';
import { sectionHeading } from './section-heading.function.ts';
import type { ResumePdfNode } from '../interface/resume-pdf-node/resume-pdf-node.interface.ts';
import { experienceBlock } from './experience-block.function.ts';
import type { Experience } from '../interface/experience/experience.interface.ts';
import { educationBlock } from './education-block.function.ts';
import type { ResumeEducation } from '../interface/resume-education/resume-education.interface.ts';
import { skillTableRows } from './skill-table-rows.function.ts';
import { detailRow } from './detail-row.function.ts';
import { collectProperty } from './collect-property.function.ts';
import { expectedResumeText } from './expected-resume-text.function.ts';

/** Builds a deterministic, browser-font-compatible pdfmake document definition. */
export const buildResumeDocumentDefinition = new InjectionToken<
  (profile: ResumeProfile) => ResumePdfDocumentDefinition
>('buildResumeDocumentDefinition', {
  providedIn: 'root',
  factory: () => {
    const fn = (
      validateResumeProfileFn: (profile: unknown) => void,
      metadataDate: string,
      browserFont: string,
      color: COLOR_TYPE,
      sectionHeadingFn: (text: string) => ResumePdfNode,
      experienceBlockFn: (experience: Experience) => ResumePdfNode,
      educationBlockFn: (education: ResumeEducation) => ResumePdfNode,
      skillTableRowsFn: (skills: readonly string[]) => ResumePdfNode[][],
      detailRowFn: (label: string, value: string, link?: string) => readonly ResumePdfNode[],
      collectPropertyFn: (value: unknown, propertyName: string) => string[],
      expectedResumeTextFn: (profile: ResumeProfile) => string[],
    ) => {
      return (profile: ResumeProfile): ResumePdfDocumentDefinition => {
        validateResumeProfileFn(profile);

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
            creationDate: new Date(metadataDate),
            modDate: new Date(metadataDate),
          },
          language: 'en',
          defaultStyle: {
            font: browserFont,
            fontSize: 9.4,
            lineHeight: 1.22,
            color: color.text,
          },
          styles: {
            sectionHeading: {
              fontSize: 14,
              bold: true,
              color: color.navy,
            },
            body: {
              fontSize: 9.4,
              lineHeight: 1.25,
            },
            role: {
              fontSize: 11.5,
              bold: true,
              color: color.navy,
            },
            period: {
              fontSize: 8.5,
              bold: true,
              color: color.accent,
            },
            employmentType: {
              font: BROWSER_FONT,
              fontSize: 8.5,
              bold: true,
              color: color.accent,
            },
            detailLabel: {
              fontSize: 8.5,
              bold: true,
              color: color.navy,
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
                  color: currentPage === 1 ? color.accent : color.navy,
                },
              ],
            };
          },
          footer(currentPage, pageCount) {
            return {
              text: `${profile.name}  ·  ${currentPage} / ${pageCount}`,
              alignment: 'center',
              color: color.muted,
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
                        { text: profile.name, fontSize: 25, bold: true, color: color.white },
                        {
                          text: profile.title,
                          fontSize: 13,
                          color: '#d9eaff',
                          margin: [0, 5, 0, 0],
                        },
                      ],
                      fillColor: color.navy,
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
                    { text: profile.details.location, bold: true, color: color.navy },
                    {
                      text: profile.details.email,
                      link: emailLink,
                      color: color.accent,
                      decoration: 'underline',
                      margin: [0, 3, 0, 0],
                    },
                  ],
                },
                {
                  width: 'auto',
                  text: profile.details.phoneLabel,
                  bold: true,
                  color: color.muted,
                  alignment: 'right',
                },
              ],
              columnGap: 20,
              margin: [0, 0, 0, 2],
            },
            sectionHeadingFn('Professional summary'),
            {
              ul: profile.summary.map((text) => ({ text })),
              style: 'body',
              margin: [12, 0, 0, 2],
            },
            sectionHeadingFn('Experience'),
            ...profile.experience.map(experienceBlockFn),
            sectionHeadingFn('Education'),
            educationBlockFn(profile.education),
            sectionHeadingFn('Core skills'),
            {
              table: {
                widths: ['*', '*', '*'],
                body: skillTableRowsFn(profile.skills),
              },
              layout: {
                hLineColor: () => color.border,
                vLineColor: () => color.border,
                hLineWidth: () => 0.6,
                vLineWidth: () => 0.6,
              },
            },
            sectionHeadingFn('Profile details'),
            {
              table: {
                widths: [90, '*'],
                body: [
                  detailRowFn('Location', profile.details.location),
                  detailRowFn('Phone', profile.details.phoneLabel),
                  detailRowFn('Email', profile.details.email, emailLink),
                  detailRowFn('Nationality', profile.details.nationality),
                  detailRowFn('Date of birth', profile.details.birthDate),
                ],
              },
              layout: {
                hLineColor: () => color.border,
                vLineWidth: () => 0,
                hLineWidth: (index) => (index === 0 ? 0 : 0.5),
                paddingLeft: () => 0,
                paddingRight: () => 8,
                paddingTop: () => 5,
                paddingBottom: () => 5,
              },
            },
            sectionHeadingFn('Links'),
            ...profile.links.map(({ label, url }) => ({
              text: [
                { text: `${label}: `, bold: true, color: color.navy },
                { text: url, link: url, color: color.accent, decoration: 'underline' as const },
              ],
              margin: [0, 0, 0, 5] as const,
            })),
          ],
        };

        const documentText = collectPropertyFn(definition, 'text').join('\n');

        for (const requiredText of expectedResumeTextFn(profile)) {
          if (!documentText.includes(requiredText)) {
            throw new Error(`The PDF document definition is missing résumé text: ${requiredText}`);
          }
        }

        return definition;
      };
    };

    return fn(
      inject(validateResumeProfile),
      inject(METADATA_DATE),
      inject(BROWSER_FONT),
      inject(COLORS),
      inject(sectionHeading),
      inject(experienceBlock),
      inject(educationBlock),
      inject(skillTableRows),
      inject(detailRow),
      inject(collectProperty),
      inject(expectedResumeText),
    );
  },
});
