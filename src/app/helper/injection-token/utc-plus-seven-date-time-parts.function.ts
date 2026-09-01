import { inject, InjectionToken } from '@angular/core';
import type { UtcPlusSevenDateTimeParts } from '../interface/utc-plus-seven-date-time-parts/utc-plus-seven-date-time-parts.ts';
import { UTC_PLUS_SEVEN_OFFSET_MS } from './utc-plus-seven-offset-ms.variable.ts';

/** Extracts fixed UTC+7 fields without consulting the host's local timezone. */
export const utcPlusSevenDateTimeParts = new InjectionToken<
  (instant: Date) => UtcPlusSevenDateTimeParts
>('utcPlusSevenDateTimeParts', {
  providedIn: 'root',
  factory: () => {
    const fn = (utcPlusSevenOffsetMs: number) => {
      return (instant: Date): UtcPlusSevenDateTimeParts => {
        const shiftedInstant = new Date(instant.getTime() + utcPlusSevenOffsetMs);

        return {
          year: shiftedInstant.getUTCFullYear(),
          month: shiftedInstant.getUTCMonth() + 1,
          dayOfMonth: shiftedInstant.getUTCDate(),
          dayOfWeek: shiftedInstant.getUTCDay(),
          hours: shiftedInstant.getUTCHours(),
          minutes: shiftedInstant.getUTCMinutes(),
          seconds: shiftedInstant.getUTCSeconds(),
        };
      };
    };

    return fn(inject(UTC_PLUS_SEVEN_OFFSET_MS));
  },
});
