import { inject, InjectionToken } from '@angular/core';
import type { TechnologyIconMetadata } from '../interface/brand-logo/technology-icon-meta-data/technology-icon-meta-data.interface.ts';
import { assetUrlBuilder } from './asset-url-builder.function.ts';

/** Shared artwork metadata for Spring products that use the same brand mark. */
export const SPRING_ICON = new InjectionToken<TechnologyIconMetadata>('SPRING_ICON', {
  providedIn: 'root',
  factory: () => {
    const urlBuilder = inject(assetUrlBuilder);

    return {
      src: urlBuilder.file('spring.svg'),
      width: 24,
      height: 24,
      surface: 'light',
    };
  },
});
