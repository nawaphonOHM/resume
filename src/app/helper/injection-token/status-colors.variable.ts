import { InjectionToken } from '@angular/core';
import type { STATUS_COLORS } from './status_colors.type.ts';

/** Confirmed colors for available, limited, and unavailable UTC+7 periods. */
export const statusColor = new InjectionToken<STATUS_COLORS>('StatusColor', {
  providedIn: 'root',
  factory: () => {
    return {
      available: '#92C353',
      limited: '#F7A600',
      unavailable: '#D1D1D1',
    };
  },
});
