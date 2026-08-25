import { InjectionToken } from '@angular/core';
import type { TechnologyIconOpenCvLoader } from '../type/technology-icon-open-cv-loader.type.ts';

/**
 * Loader whose factory keeps OpenCV out of the initial bundle and does no work
 * until the returned function is called from a scheduled enhancement.
 */
export const TECHNOLOGY_ICON_OPEN_CV_LOADER = new InjectionToken<TechnologyIconOpenCvLoader>(
  'TECHNOLOGY_ICON_OPEN_CV_LOADER',
  {
    providedIn: 'root',
    factory: () => (sourceUrl) => import(sourceUrl) as Promise<unknown>,
  },
);
