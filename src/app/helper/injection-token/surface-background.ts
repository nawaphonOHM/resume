import { InjectionToken } from '@angular/core';
import type { TechnologyIconBackgroundColor } from '../type/technology-icon-background-color.type.ts';
import type { BrandLogo } from '../interface/brand-logo/brand-logo.interface.ts';

export const SURFACE_BACKGROUND = new InjectionToken<
  Readonly<Record<BrandLogo['surface'], TechnologyIconBackgroundColor>>
>('SURFACE_BACKGROUND', {
  providedIn: 'root',
  factory: () => ({
    light: '#ffffff',
    dark: '#0d1b2d',
  }),
});
