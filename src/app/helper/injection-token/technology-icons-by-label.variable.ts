import { TechnologyIconMetadata } from '../interface/brand-logo/technology-icon-meta-data/technology-icon-meta-data.interface.ts';
import { TECHNOLOGY_ICONS } from './technology-icons.variable.ts';
import { inject } from '@angular/core';

export const technologyIconsByLabel: Readonly<Record<string, TechnologyIconMetadata | undefined>> =
  inject(TECHNOLOGY_ICONS);
