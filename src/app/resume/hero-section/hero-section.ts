import {
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import type { ResumeProfile } from '../../helper/resume-profile/resume-profile.interface.ts';

/** Milliseconds between UTC and the fixed Bangkok UTC+7 timezone. */
const UTC_PLUS_SEVEN_OFFSET_MS = 7 * 60 * 60 * 1_000;

/** Frequency at which the visible clock is synchronized with the current instant. */
const CLOCK_UPDATE_INTERVAL_MS = 1_000;

/** Seconds in one hour, used to express availability boundaries from midnight. */
const SECONDS_PER_HOUR = 60 * 60;

/** Confirmed colors for available, limited, and unavailable UTC+7 periods. */
const STATUS_COLORS = {
  available: '#92C353',
  limited: '#F7A600',
  unavailable: '#D1D1D1',
} as const;

/** One of the normalized colors supported by the availability indicator. */
type StatusColor = (typeof STATUS_COLORS)[keyof typeof STATUS_COLORS];

/** Calendar and clock fields read in the fixed UTC+7 timezone. */
interface UtcPlusSevenDateTimeParts {
  readonly year: number;
  readonly month: number;
  readonly dayOfMonth: number;
  readonly dayOfWeek: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
}

/** Extracts fixed UTC+7 fields without consulting the host's local timezone. */
function utcPlusSevenDateTimeParts(instant: Date): UtcPlusSevenDateTimeParts {
  const shiftedInstant = new Date(instant.getTime() + UTC_PLUS_SEVEN_OFFSET_MS);

  return {
    year: shiftedInstant.getUTCFullYear(),
    month: shiftedInstant.getUTCMonth() + 1,
    dayOfMonth: shiftedInstant.getUTCDate(),
    dayOfWeek: shiftedInstant.getUTCDay(),
    hours: shiftedInstant.getUTCHours(),
    minutes: shiftedInstant.getUTCMinutes(),
    seconds: shiftedInstant.getUTCSeconds(),
  };
}

/** Pads one numeric date field to its display width. */
function padDateTimePart(value: number, length = 2): string {
  return value.toString().padStart(length, '0');
}

/** Formats an instant as `YYYY-MM-DD HH:mm:ss` in fixed UTC+7. */
function formatUtcPlusSevenDateTime(instant: Date): string {
  const { year, month, dayOfMonth, hours, minutes, seconds } = utcPlusSevenDateTimeParts(instant);

  return `${padDateTimePart(year, 4)}-${padDateTimePart(month)}-${padDateTimePart(dayOfMonth)} ${padDateTimePart(hours)}:${padDateTimePart(minutes)}:${padDateTimePart(seconds)}`;
}

/** Resolves the availability color from the fixed UTC+7 weekday and time boundaries. */
function statusColorForUtcPlusSeven(instant: Date): StatusColor {
  const { dayOfWeek, hours, minutes, seconds } = utcPlusSevenDateTimeParts(instant);
  const secondsSinceMidnight = hours * SECONDS_PER_HOUR + minutes * 60 + seconds;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (secondsSinceMidnight < 6 * SECONDS_PER_HOUR) {
    return STATUS_COLORS.unavailable;
  }

  if (secondsSinceMidnight >= 22 * SECONDS_PER_HOUR) {
    return STATUS_COLORS.unavailable;
  }

  if (isWeekend) {
    return STATUS_COLORS.limited;
  }

  if (secondsSinceMidnight < 9 * SECONDS_PER_HOUR) {
    return STATUS_COLORS.limited;
  }

  if (secondsSinceMidnight < 12 * SECONDS_PER_HOUR) {
    return STATUS_COLORS.available;
  }

  if (secondsSinceMidnight < 13 * SECONDS_PER_HOUR) {
    return STATUS_COLORS.limited;
  }

  if (secondsSinceMidnight < 18 * SECONDS_PER_HOUR) {
    return STATUS_COLORS.available;
  }

  return STATUS_COLORS.limited;
}

/** Introduces the candidate and exposes the primary email contact action. */
@Component({
  selector: 'app-hero-section',
  imports: [MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.scss',
})
export class HeroSection {
  private readonly destroyRef = inject(DestroyRef);
  private readonly currentInstant = signal(new Date());

  /** Complete profile supplying the candidate identity and public contact details. */
  readonly profile = input.required<ResumeProfile>();

  /** Current fixed UTC+7 date and time rendered beside the profile location. */
  protected readonly formattedTime = computed(() =>
    formatUtcPlusSevenDateTime(this.currentInstant()),
  );

  /** Availability color for the same current instant as the visible UTC+7 clock. */
  protected readonly statusColor = computed(() =>
    statusColorForUtcPlusSeven(this.currentInstant()),
  );

  /** Starts browser clock synchronization after rendering and releases it on destruction. */
  constructor() {
    afterNextRender(() => {
      const intervalId = window.setInterval(
        () => this.currentInstant.set(new Date()),
        CLOCK_UPDATE_INTERVAL_MS,
      );

      this.destroyRef.onDestroy(() => window.clearInterval(intervalId));
    });
  }

  /** @returns A direct email URI for the profile's public address. */
  protected emailHref(): string {
    return `mailto:${this.profile().details.email}`;
  }
}
