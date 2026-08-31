import { inject, InjectionToken } from '@angular/core';
import { TechnologyIconMetadata } from '../interface/brand-logo/technology-icon-meta-data/technology-icon-meta-data.interface.ts';
import { TECHNOLOGY_ICONS } from './technology-icons.variable.ts';

export const resolveTechnologyIcon = new InjectionToken<
  (label: string) => TechnologyIconMetadata | undefined
>('resolveTechnologyIcon', {
  providedIn: 'root',

  factory: () => {
    const fn = (technologyIconsByLabel: Readonly<Record<string, TechnologyIconMetadata>>) => {
      return (label: string): TechnologyIconMetadata | undefined => {
        return Object.hasOwn(technologyIconsByLabel, label)
          ? technologyIconsByLabel[label]
          : undefined;
      };
    };

    return fn(inject(TECHNOLOGY_ICONS));
  },
});
