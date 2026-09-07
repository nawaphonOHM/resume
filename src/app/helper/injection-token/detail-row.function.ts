import { inject, InjectionToken } from '@angular/core';
import type { ResumePdfNode } from '../interface/resume-pdf-node/resume-pdf-node.interface.ts';
import { COLORS } from './colors.variable.ts';
import type { COLOR_TYPE } from '../type/colors.type.ts';

export const detailRow = new InjectionToken<
  (label: string, value: string, link?: string) => readonly ResumePdfNode[]
>('detailRow', {
  providedIn: 'root',
  factory: () => {
    const fn = (colors: COLOR_TYPE) => {
      return (label: string, value: string, link?: string): readonly ResumePdfNode[] => {
        return [
          { text: label, style: 'detailLabel' },
          {
            text: value,
            ...(link ? { link, color: colors.accent, decoration: 'underline' as const } : {}),
          },
        ];
      };
    };

    return fn(inject(COLORS));
  },
});
