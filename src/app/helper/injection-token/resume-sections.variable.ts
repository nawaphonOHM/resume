import { InjectionToken } from '@angular/core';
import type { ResumeNavigationSection } from '../interface/resume-navigation-section/resume-navigation-section.interface.ts';

/** Ordered registry used by both navigation links and page-level section observation. */
export const RESUME_SECTIONS = new InjectionToken<readonly ResumeNavigationSection[]>(
  'RESUME_SECTIONS',
  {
    providedIn: 'root',
    factory: () =>
      [
        { id: 'about', label: 'About' },
        { id: 'experience', label: 'Experience' },
        { id: 'education', label: 'Education' },
        { id: 'skills', label: 'Skills' },
        { id: 'profile', label: 'Profile' },
      ] as const satisfies readonly ResumeNavigationSection[],
  },
);
