import { inject, InjectionToken } from '@angular/core';
import type { ResumePdfNode } from '../interface/resume-pdf-node/resume-pdf-node.interface.ts';
import { COLORS } from './colors.variable.ts';
import type { COLOR_TYPE } from '../type/colors.type.ts';

export const skillTableRows = new InjectionToken<(skills: readonly string[]) => ResumePdfNode[][]>(
  'skillTableRows',
  {
    providedIn: 'root',
    factory: () => {
      const fn = (color: COLOR_TYPE) => {
        return (skills: readonly string[]): ResumePdfNode[][] => {
          const cells: ResumePdfNode[] = skills.map((skill) => ({
            text: skill,
            bold: true,
            color: color.navy,
            fillColor: color.surface,
            margin: [8, 6, 8, 6],
          }));
          const rows: ResumePdfNode[][] = [];

          for (let index = 0; index < cells.length; index += 3) {
            const row = cells.slice(index, index + 3);

            while (row.length < 3) {
              row.push({ text: '', fillColor: color.surface, margin: [8, 6, 8, 6] });
            }

            rows.push(row);
          }

          return rows;
        };
      };

      return fn(inject(COLORS));
    },
  },
);
