import { inject, InjectionToken } from '@angular/core';
import { IMAGE_ASSET_ORIGIN } from './image-asset-origin.variable.ts';
import { statusColor } from './status-colors.variable.ts';
import type { STATUS_COLORS } from './status_colors.type.ts';
import type { StatusColor } from '../type/status-color.type.ts';

/** Resolves the CDN favicon SVG URL corresponding to an availability status color. */
export const statusFaviconForStatusColor = new InjectionToken<(color: StatusColor) => string>(
  'statusFaviconForStatusColor',
  {
    providedIn: 'root',
    factory: () => {
      const fn = (imageAssetOrigin: string, statusColors: STATUS_COLORS) => {
        const mapping: Record<string, string> = {
          [statusColors.available]: `${imageAssetOrigin}/favicons/available/favicon.svg`,
          [statusColors.limited]: `${imageAssetOrigin}/favicons/limited/favicon.svg`,
          [statusColors.unavailable]: `${imageAssetOrigin}/favicons/unavailable/favicon.svg`,
        };

        return (color: StatusColor): string => {
          return mapping[color] ?? `${imageAssetOrigin}/favicons/unavailable/favicon.svg`;
        };
      };

      return fn(inject(IMAGE_ASSET_ORIGIN), inject(statusColor));
    },
  },
);
