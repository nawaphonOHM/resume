import { inject, InjectionToken } from '@angular/core';
import { SECONDS_PER_HOUR } from './seconds-per-hour.variable.ts';
import { utcPlusSevenDateTimeParts } from './utc-plus-seven-date-time-parts.function.ts';

/** Frequency parameter (f in Hz) for hero code badges circular orbit motion derived from current day of month in UTC+7. */
export const HERO_CODE_F = new InjectionToken<number>('HERO_CODE_F', {
  providedIn: 'root',
  factory: () => {
    const dateTimePartsFn = inject(utcPlusSevenDateTimeParts);
    const secondsPerHour = inject(SECONDS_PER_HOUR);
    const { dayOfMonth } = dateTimePartsFn(new Date());
    return dayOfMonth / secondsPerHour;
  },
});
