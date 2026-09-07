import { inject, InjectionToken } from '@angular/core';
import type { ResumeProfile } from '../interface/resume-profile/resume-profile.interface.ts';
import { employmentTypeLabel } from './employment-type-label.function.ts';
import type { Experience } from '../interface/experience/experience.interface.ts';

export const expectedResumeText = new InjectionToken<(profile: ResumeProfile) => string[]>(
  'expectedResumeText',
  {
    providedIn: 'root',
    factory: () => {
      const fn = (employmentTypeLabelFn: (experience: Experience) => string) => {
        return (profile: ResumeProfile): string[] => {
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
              employmentTypeLabelFn(experience),
              ...experience.highlights,
              ...experience.technologies,
            ]),
            profile.education.degree,
            profile.education.institution,
            profile.education.period,
            profile.education.gpax,
            profile.education.seniorProject.name,
          ];
        };
      };

      return fn(inject(employmentTypeLabel));
    },
  },
);
