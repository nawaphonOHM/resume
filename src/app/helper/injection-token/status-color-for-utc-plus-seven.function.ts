import { inject, InjectionToken } from '@angular/core';
import { utcPlusSevenDateTimeParts } from './utc-plus-seven-date-time-parts.function.ts';
import type { UtcPlusSevenDateTimeParts } from '../interface/utc-plus-seven-date-time-parts/utc-plus-seven-date-time-parts.ts';
import { SECONDS_PER_HOUR } from './seconds-per-hour.variable.ts';
import type { StatusColor } from '../type/status-color.type.ts';
import type { STATUS_COLORS } from './status_colors.type.ts';
import { statusColor } from './status-colors.variable.ts';

/** Resolves the availability color from the fixed UTC+7 weekday and time boundaries. */
export const statusColorForUtcPlusSeven = new InjectionToken('statusColorForUtcPlusSeven', {
  providedIn: 'root',
  factory: () => {
    const fn = (
      utcPlusSevenDateTimeParts: (instant: Date) => UtcPlusSevenDateTimeParts,
      secondPerHour: number,
      statusColors: STATUS_COLORS,
    ) => {
      return (instant: Date): StatusColor => {
        const { dayOfWeek, hours, minutes, seconds } = utcPlusSevenDateTimeParts(instant);
        const secondsSinceMidnight = hours * secondPerHour + minutes * 60 + seconds;
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (secondsSinceMidnight < 6 * secondPerHour) {
          return statusColors.unavailable;
        }

        if (secondsSinceMidnight >= 22 * secondPerHour) {
          return statusColors.unavailable;
        }

        if (isWeekend) {
          return statusColors.limited;
        }

        if (secondsSinceMidnight < 9 * secondPerHour) {
          return statusColors.limited;
        }

        if (secondsSinceMidnight < 12 * secondPerHour) {
          return statusColors.available;
        }

        if (secondsSinceMidnight < 13 * secondPerHour) {
          return statusColors.limited;
        }

        if (secondsSinceMidnight < 18 * secondPerHour) {
          return statusColors.available;
        }

        return statusColors.limited;
      };
    };

    return fn(inject(utcPlusSevenDateTimeParts), inject(SECONDS_PER_HOUR), inject(statusColor));
  },
});
