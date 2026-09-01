import { inject, InjectionToken } from '@angular/core';
import { STATUS_COLORS, type StatusColor } from './status_colors.variable.ts';
import { utcPlusSevenDateTimeParts } from './utc-plus-seven-date-time-parts.function.ts';
import type { UtcPlusSevenDateTimeParts } from '../interface/utc-plus-seven-date-time-parts/utc-plus-seven-date-time-parts.ts';
import { SECONDS_PER_HOUR } from './seconds-per-hour.variable.ts';

/** Resolves the availability color from the fixed UTC+7 weekday and time boundaries. */
export const statusColorForUtcPlusSeven = new InjectionToken('statusColorForUtcPlusSeven', {
  providedIn: 'root',
  factory: () => {
    const fn = (
      utcPlusSevenDateTimeParts: (instant: Date) => UtcPlusSevenDateTimeParts,
      secondPerHour: number,
    ) => {
      return (instant: Date): StatusColor => {
        const { dayOfWeek, hours, minutes, seconds } = utcPlusSevenDateTimeParts(instant);
        const secondsSinceMidnight = hours * secondPerHour + minutes * 60 + seconds;
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (secondsSinceMidnight < 6 * secondPerHour) {
          return STATUS_COLORS.unavailable;
        }

        if (secondsSinceMidnight >= 22 * secondPerHour) {
          return STATUS_COLORS.unavailable;
        }

        if (isWeekend) {
          return STATUS_COLORS.limited;
        }

        if (secondsSinceMidnight < 9 * secondPerHour) {
          return STATUS_COLORS.limited;
        }

        if (secondsSinceMidnight < 12 * secondPerHour) {
          return STATUS_COLORS.available;
        }

        if (secondsSinceMidnight < 13 * secondPerHour) {
          return STATUS_COLORS.limited;
        }

        if (secondsSinceMidnight < 18 * secondPerHour) {
          return STATUS_COLORS.available;
        }

        return STATUS_COLORS.limited;
      };
    };

    return fn(inject(utcPlusSevenDateTimeParts), inject(SECONDS_PER_HOUR));
  },
});
