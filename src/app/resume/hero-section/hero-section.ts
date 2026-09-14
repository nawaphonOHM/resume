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

import type { ResumeProfile } from '../../helper/interface/resume-profile/resume-profile.interface.ts';
import { formatUtcPlusSevenDateTime } from '../../helper/injection-token/format-utc-plus-seven-date-time.function.ts';
import { CLOCK_UPDATE_INTERVAL_MS } from '../../helper/injection-token/clock-update_interval-ms.variable.ts';
import { statusColorForUtcPlusSeven } from '../../helper/injection-token/status-color-for-utc-plus-seven.function.ts';
import { heroClockTransitionPicker } from '../../helper/injection-token/hero-clock-transition-picker.variable.ts';
import { calculateStatusLuminance } from '../../helper/injection-token/status-luminance.function.ts';

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
  private readonly formatUtcPlusSevenDateTimeFn = inject(formatUtcPlusSevenDateTime);
  private readonly clockUpdateIntervalMs = inject(CLOCK_UPDATE_INTERVAL_MS);
  private readonly statusColorForUtcPlusSeven = inject(statusColorForUtcPlusSeven);
  private readonly calculateStatusLuminanceFn = inject(calculateStatusLuminance);

  /** Selected transition effect applied on each clock tick. */
  protected readonly clockTransition = inject(heroClockTransitionPicker)();

  /** Complete profile supplying the candidate identity and public contact details. */
  readonly profile = input.required<ResumeProfile>();

  /** Current fixed UTC+7 date and time rendered beside the profile location. */
  protected readonly formattedTime = computed(() =>
    this.formatUtcPlusSevenDateTimeFn(this.currentInstant()),
  );

  /** Alternates on each clock tick to re-trigger slide-and-fade CSS animations. */
  protected readonly isTickAlternate = signal(false);

  /** Availability color for the same current instant as the visible UTC+7 clock. */
  protected readonly statusColor = computed(() =>
    this.statusColorForUtcPlusSeven(this.currentInstant()),
  );

  /** Oscillating luminance level of the availability status indicator. */
  protected readonly statusLuminance = signal(this.calculateStatusLuminanceFn(0));

  /** Starts browser clock synchronization and luminance oscillation after rendering, releasing them on destruction. */
  constructor() {
    afterNextRender(() => {
      const intervalId = window.setInterval(() => {
        this.currentInstant.set(new Date());
        this.isTickAlternate.update((v) => !v);
      }, this.clockUpdateIntervalMs);

      let animationFrameId: number;
      const startTimestamp = performance.now();

      const animateLuminance = (currentTimestamp: DOMHighResTimeStamp) => {
        const elapsedSeconds = (currentTimestamp - startTimestamp) / 1000;
        this.statusLuminance.set(this.calculateStatusLuminanceFn(elapsedSeconds));
        animationFrameId = window.requestAnimationFrame(animateLuminance);
      };

      animationFrameId = window.requestAnimationFrame(animateLuminance);

      this.destroyRef.onDestroy(() => {
        window.clearInterval(intervalId);
        window.cancelAnimationFrame(animationFrameId);
      });
    });
  }

  /** @returns A direct email URI for the profile's public address. */
  protected emailHref(): string {
    return `mailto:${this.profile().details.email}`;
  }
}
