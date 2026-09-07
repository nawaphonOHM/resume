import { InjectionToken } from '@angular/core';
import type { Experience } from '../interface/experience/experience.interface.ts';

export const employmentTypeLabel = new InjectionToken<(experience: Experience) => string>(
  'employmentTypeLabel',
  {
    providedIn: 'root',
    factory: () => {
      return (experience: Experience): string => {
        return experience.employmentTypes.join(' → ');
      };
    },
  },
);
