import {
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import type { ResumeProfile } from '../../helper/interface/resume-profile/resume-profile.interface.ts';
import { CLOCK_UPDATE_INTERVAL_MS } from '../../helper/injection-token/clock-update_interval-ms.variable.ts';
import { statusColorForUtcPlusSeven } from '../../helper/injection-token/status-color-for-utc-plus-seven.function.ts';
import { heroClockTransitionPicker } from '../../helper/injection-token/hero-clock-transition-picker.variable.ts';
import { calculateStatusLuminance } from '../../helper/injection-token/status-luminance.function.ts';
import { calculateHeroCodePosition } from '../../helper/injection-token/hero-code-position.function.ts';
import { FaviconService } from '../../core/favicon.service.ts';
import { statusFaviconForStatusColor } from '../../helper/injection-token/status-favicon-for-status-color.function.ts';

/** Introduces the candidate and exposes the primary email contact action. */
@Component({
  selector: 'app-hero-section',
  imports: [MatButtonModule, MatIconModule, RouterLink, DatePipe],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.scss',
})
export class HeroSection {
  private readonly destroyRef = inject(DestroyRef);
  protected readonly currentInstant = signal(new Date());
  private readonly clockUpdateIntervalMs = inject(CLOCK_UPDATE_INTERVAL_MS);
  private readonly statusColorForUtcPlusSeven = inject(statusColorForUtcPlusSeven);
  private readonly calculateStatusLuminanceFn = inject(calculateStatusLuminance);
  private readonly calculateHeroCodePositionFn = inject(calculateHeroCodePosition);
  private readonly faviconService = inject(FaviconService);
  private readonly statusFaviconForStatusColor = inject(statusFaviconForStatusColor);

  /** Selected transition effect applied on each clock tick. */
  protected readonly clockTransition = inject(heroClockTransitionPicker)();

  /** Complete profile supplying the candidate identity and public contact details. */
  readonly profile = input.required<ResumeProfile>();

  /** Alternates on each clock tick to re-trigger slide-and-fade CSS animations. */
  protected readonly isTickAlternate = signal(false);

  /** Availability color for the same current instant as the visible UTC+7 clock. */
  protected readonly statusColor = computed(() =>
    this.statusColorForUtcPlusSeven(this.currentInstant()),
  );

  /** Oscillating luminance level of the availability status indicator. */
  protected readonly statusLuminance = signal(this.calculateStatusLuminanceFn(0));

  /** Orbital coordinates for the left hero code badge. */
  protected readonly leftCodePosition = signal(this.calculateHeroCodePositionFn(0).left);

  /** Orbital coordinates for the right hero code badge. */
  protected readonly rightCodePosition = signal(this.calculateHeroCodePositionFn(0).right);

  /** Starts browser clock synchronization and visual animations after rendering, releasing them on destruction. */
  constructor() {
    effect(() => {
      this.faviconService.setFavicon(this.statusFaviconForStatusColor(this.statusColor()));
    });

    afterNextRender(() => {
      const intervalId = window.setInterval(() => {
        this.currentInstant.set(new Date());
        this.isTickAlternate.update((v) => !v);
      }, this.clockUpdateIntervalMs);

      let animationFrameId: number;
      const startTimestamp = performance.now();

      const animateHeroVisuals = (currentTimestamp: DOMHighResTimeStamp) => {
        const elapsedSeconds = (currentTimestamp - startTimestamp) / 1000;
        this.statusLuminance.set(this.calculateStatusLuminanceFn(elapsedSeconds));
        const { left, right } = this.calculateHeroCodePositionFn(elapsedSeconds);
        this.leftCodePosition.set(left);
        this.rightCodePosition.set(right);
        animationFrameId = window.requestAnimationFrame(animateHeroVisuals);
      };

      animationFrameId = window.requestAnimationFrame(animateHeroVisuals);

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
