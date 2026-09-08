import { inject, InjectionToken } from '@angular/core';
import type { Experience } from '../interface/experience/experience.interface.ts';
import type { ResumePdfNode } from '../interface/resume-pdf-node/resume-pdf-node.interface.ts';
import { COLORS } from './colors.variable.ts';
import { employmentTypeLabel } from './employment-type-label.function.ts';
import type { COLOR_TYPE } from '../type/colors.type.ts';

export const experienceBlock = new InjectionToken<(experience: Experience) => ResumePdfNode>(
  'experienceBlock',
  {
    providedIn: 'root',
    factory: () => {
      const fn = (employmentTypeLabelFn: (experience: Experience) => string, color: COLOR_TYPE) => {
        return (experience: Experience): ResumePdfNode => {
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
                  { text: ` · ${experience.location}`, color: color.muted },
                  { text: '  ·  ', color: color.muted },
                  { text: employmentTypeLabelFn(experience), style: 'employmentType' },
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
                  { text: 'Technologies  ', bold: true, color: color.navy },
                  { text: experience.technologies.join(' · '), color: color.muted },
                ],
                style: 'technology',
              },
            ],
            margin: [0, 0, 0, 14],
          };
        };
      };

      return fn(inject(employmentTypeLabel), inject(COLORS));
    },
  },
);
