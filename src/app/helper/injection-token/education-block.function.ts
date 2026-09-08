import { inject, InjectionToken } from '@angular/core';
import type { ResumeEducation } from '../interface/resume-education/resume-education.interface.ts';
import type { ResumePdfNode } from '../interface/resume-pdf-node/resume-pdf-node.interface.ts';
import { COLORS } from './colors.variable.ts';
import type { COLOR_TYPE } from '../type/colors.type.ts';

export const educationBlock = new InjectionToken<(education: ResumeEducation) => ResumePdfNode>(
  'educationBlock',
  {
    providedIn: 'root',
    factory: () => {
      const fn = (color: COLOR_TYPE) => {
        return (education: ResumeEducation): ResumePdfNode => {
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
                                color: color.accent,
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
                                  { text: 'GPAX  ', bold: true, color: color.navy },
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
                          { text: 'Senior project: ', bold: true, color: color.navy },
                          { text: education.seniorProject.name },
                          { text: '  ·  ', color: color.muted },
                          {
                            text: 'View source code',
                            link: education.seniorProject.url,
                            color: color.accent,
                            decoration: 'underline',
                          },
                        ],
                        margin: [0, 9, 0, 0],
                      },
                    ],
                    fillColor: color.surface,
                    margin: [12, 10, 12, 10],
                  },
                ],
              ],
            },
            layout: {
              hLineColor: () => color.border,
              vLineColor: () => color.border,
              hLineWidth: () => 0.6,
              vLineWidth: () => 0.6,
            },
          };
        };
      };

      return fn(inject(COLORS));
    },
  },
);
