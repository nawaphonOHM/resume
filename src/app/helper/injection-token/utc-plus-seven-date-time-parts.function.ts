import { inject, InjectionToken } from '@angular/core';
import type { UtcPlusSevenDateTimeParts } from '../interface/utc-plus-seven-date-time-parts/utc-plus-seven-date-time-parts.ts';
import { UTC_PLUS_SEVEN_OFFSET_MS } from './utc-plus-seven-offset-ms.variable.ts';

/**
 * Extracts calendar and clock components for a given instant in Bangkok / Indochina Time (ICT, UTC+7)
 * using an epoch-shifting technique that completely eliminates host timezone contamination.
 *
 * ### Rationale & Epoch Shifting Mechanics
 * Standard JavaScript `Date` getters (`getFullYear()`, `getHours()`, etc.) reflect the host machine's
 * local timezone and daylight saving time (DST) rules, causing non-deterministic behavior across clients.
 *
 * Rather than relying on string-based `Intl.DateTimeFormat` parsing or timezone environment variables,
 * this function shifts the UTC epoch millisecond timestamp forward by exactly $+7\text{ hours}$:
 *
 * ```
 * shiftedEpochMs = instant.getTime() + UTC_PLUS_SEVEN_OFFSET_MS
 *   where UTC_PLUS_SEVEN_OFFSET_MS = 7 × 3600 × 1000 = 25,200,000 ms (+7 hours)
 * ```
 *
 * By querying the shifted timestamp via native UTC methods (`getUTCFullYear()`, `getUTCHours()`, etc.),
 * the extracted calendar components accurately reflect local Bangkok time (which observes fixed UTC+7
 * with no daylight saving shifts) regardless of the client's geographic location or system locale.
 *
 * @returns An injection token providing a factory function `(instant: Date) => UtcPlusSevenDateTimeParts`.
 */
export const utcPlusSevenDateTimeParts = new InjectionToken<
  (instant: Date) => UtcPlusSevenDateTimeParts
>('utcPlusSevenDateTimeParts', {
  providedIn: 'root',
  factory: () => {
    const fn = (utcPlusSevenOffsetMs: number) => {
      return (instant: Date): UtcPlusSevenDateTimeParts => {
        // Shift instant forward by +7 hours in epoch milliseconds
        const shiftedInstant = new Date(instant.getTime() + utcPlusSevenOffsetMs);

        // Extract components strictly in UTC space to eliminate local browser timezone bias
        return {
          year: shiftedInstant.getUTCFullYear(),
          month: shiftedInstant.getUTCMonth() + 1, // Convert 0-indexed month [0..11] to 1-indexed [1..12]
          dayOfMonth: shiftedInstant.getUTCDate(),
          dayOfWeek: shiftedInstant.getUTCDay(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
          hours: shiftedInstant.getUTCHours(), // [0..23]
          minutes: shiftedInstant.getUTCMinutes(), // [0..59]
          seconds: shiftedInstant.getUTCSeconds(), // [0..59]
        };
      };
    };

    return fn(inject(UTC_PLUS_SEVEN_OFFSET_MS));
  },
});
