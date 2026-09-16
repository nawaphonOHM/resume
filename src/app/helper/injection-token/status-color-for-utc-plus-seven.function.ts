import { inject, InjectionToken } from '@angular/core';
import { utcPlusSevenDateTimeParts } from './utc-plus-seven-date-time-parts.function.ts';
import type { UtcPlusSevenDateTimeParts } from '../interface/utc-plus-seven-date-time-parts/utc-plus-seven-date-time-parts.ts';
import { SECONDS_PER_HOUR } from './seconds-per-hour.variable.ts';
import type { StatusColor } from '../type/status-color.type.ts';
import type { STATUS_COLORS } from './status_colors.type.ts';
import { statusColor } from './status-colors.variable.ts';

/**
 * Resolves the candidate's availability status color (`available`, `limited`, or `unavailable`)
 * for any given instant based on Bangkok / Indochina Time (ICT, UTC+7) business hour schedules.
 *
 * ### Schedule State Machine & Piecewise Evaluation
 * The function maps the continuous time instant to seconds elapsed since midnight:
 *
 * ```
 * S = hours · 3600 + minutes · 60 + seconds   (where S ∈ [0, 86400))
 * ```
 *
 * It then evaluates the following piecewise schedule:
 *
 * ```
 * Time Window (Bangkok / UTC+7)        Weekday (Mon–Fri)       Weekend (Sat–Sun)
 * ───────────────────────────────────────────────────────────────────────────────
 * 00:00:00 – 05:59:59 (S < 6h)          unavailable (Sleep)     unavailable (Sleep)
 * 06:00:00 – 08:59:59 (6h ≤ S < 9h)     limited (Morning prep)  limited (Standby)
 * 09:00:00 – 11:59:59 (9h ≤ S < 12h)    available (Core work)   limited (Standby)
 * 12:00:00 – 12:59:59 (12h ≤ S < 13h)   limited (Lunch break)   limited (Standby)
 * 13:00:00 – 17:59:59 (13h ≤ S < 18h)   available (Core work)   limited (Standby)
 * 18:00:00 – 21:59:59 (18h ≤ S < 22h)   limited (Evening)       limited (Standby)
 * 22:00:00 – 23:59:59 (S ≥ 22h)         unavailable (Sleep)     unavailable (Sleep)
 * ```
 *
 * @returns An injection token providing a factory function `(instant: Date) => StatusColor`.
 */
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
        // Calculate seconds elapsed since UTC+7 local midnight
        const secondsSinceMidnight = hours * secondPerHour + minutes * 60 + seconds;
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday

        // 00:00:00 – 05:59:59: Sleep / Off-hours window
        if (secondsSinceMidnight < 6 * secondPerHour) {
          return statusColors.unavailable;
        }

        // 22:00:00 – 23:59:59: Late night / Off-hours window
        if (secondsSinceMidnight >= 22 * secondPerHour) {
          return statusColors.unavailable;
        }

        // Weekend (06:00 – 22:00): Standby / Limited availability throughout the day
        if (isWeekend) {
          return statusColors.limited;
        }

        // Weekday 06:00:00 – 08:59:59: Early morning prep & commute
        if (secondsSinceMidnight < 9 * secondPerHour) {
          return statusColors.limited;
        }

        // Weekday 09:00:00 – 11:59:59: Morning core business hours
        if (secondsSinceMidnight < 12 * secondPerHour) {
          return statusColors.available;
        }

        // Weekday 12:00:00 – 12:59:59: Midday lunch break
        if (secondsSinceMidnight < 13 * secondPerHour) {
          return statusColors.limited;
        }

        // Weekday 13:00:00 – 17:59:59: Afternoon core business hours
        if (secondsSinceMidnight < 18 * secondPerHour) {
          return statusColors.available;
        }

        // Weekday 18:00:00 – 21:59:59: Evening standby window
        return statusColors.limited;
      };
    };

    return fn(inject(utcPlusSevenDateTimeParts), inject(SECONDS_PER_HOUR), inject(statusColor));
  },
});
