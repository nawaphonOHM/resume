import { inject, InjectionToken } from '@angular/core';
import { assetUrlBuilder } from './asset-url-builder.function.ts';
import { statusColor } from './status-colors.variable.ts';
import type { StatusColor } from '../type/status-color.type.ts';

/** Resolves the asset favicon URL corresponding to an availability status color. */
export const statusFaviconForStatusColor = new InjectionToken<(color: StatusColor) => string>(
  'statusFaviconForStatusColor',
  {
    providedIn: 'root',
    factory: () => {
      const urlBuilder = inject(assetUrlBuilder);
      const statusColors = inject(statusColor);
      const mapping: Record<string, string> = {
        [statusColors.available]: urlBuilder.favicon('available'),
        [statusColors.limited]: urlBuilder.favicon('limited'),
        [statusColors.unavailable]: urlBuilder.favicon('unavailable'),
      };

      return (color: StatusColor): string => mapping[color] ?? urlBuilder.favicon('unavailable');
    },
  },
);
