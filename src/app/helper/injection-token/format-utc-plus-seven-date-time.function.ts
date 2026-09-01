import { inject, InjectionToken } from '@angular/core';
import { utcPlusSevenDateTimeParts } from './utc-plus-seven-date-time-parts.function.ts';
import type { UtcPlusSevenDateTimeParts } from '../interface/utc-plus-seven-date-time-parts/utc-plus-seven-date-time-parts.ts';
import { padDateTimePart } from './pad-date-time-part.function.ts';

/** Formats an instant as `YYYY-MM-DD HH:mm:ss` in fixed UTC+7. */
export const formatUtcPlusSevenDateTime = new InjectionToken('formatUtcPlusSevenDateTime', {
  providedIn: 'root',
  factory: () => {
    const fn = (
      utcPlusSevenDateTimeParts: (instant: Date) => UtcPlusSevenDateTimeParts,
      padDateTimePart: (value: number, length: number) => string,
    ) => {
      return (instant: Date) => {
        const { year, month, dayOfMonth, hours, minutes, seconds } =
          utcPlusSevenDateTimeParts(instant);

        return `${padDateTimePart(year, 4)}-${padDateTimePart(month, 2)}-${padDateTimePart(dayOfMonth, 2)} ${padDateTimePart(hours, 2)}:${padDateTimePart(minutes, 2)}:${padDateTimePart(seconds, 2)}`;
      };
    };

    return fn(inject(utcPlusSevenDateTimeParts), inject(padDateTimePart));
  },
});
