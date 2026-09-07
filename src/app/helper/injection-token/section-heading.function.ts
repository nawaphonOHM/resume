import { InjectionToken } from '@angular/core';
import type { ResumePdfNode } from '../interface/resume-pdf-node/resume-pdf-node.interface.ts';

export const sectionHeading = new InjectionToken<(text: string) => ResumePdfNode>(
  'sectionHeading',
  {
    providedIn: 'root',
    factory: () => {
      return (text: string): ResumePdfNode => {
        return {
          text,
          style: 'sectionHeading',
          headlineLevel: 1,
          margin: [0, 18, 0, 8],
        };
      };
    },
  },
);
