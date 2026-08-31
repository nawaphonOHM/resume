import { inject, InjectionToken } from '@angular/core';
import type { TechnologyIconMetadata } from '../interface/brand-logo/technology-icon-meta-data/technology-icon-meta-data.interface.ts';
import { imageAssetUrl } from './image-asset-url.function.ts';

/** Shared artwork metadata for Spring products that use the same brand mark. */
export const SPRING_ICON = new InjectionToken<TechnologyIconMetadata>('SPRING_ICON', {
  providedIn: 'root',
  factory: () => {
    const imageAssetUrlToken = inject(imageAssetUrl);

    return {
      src: imageAssetUrlToken + '/technology-icons/spring.svg',
      width: 24,
      height: 24,
      surface: 'light',
    };
  },
});
