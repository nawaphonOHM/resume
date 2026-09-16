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
import { DatePipe, DOCUMENT } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import type { ResumeProfile } from '../../helper/interface/resume-profile/resume-profile.interface.ts';
import { CLOCK_UPDATE_INTERVAL_MS } from '../../helper/injection-token/clock-update_interval-ms.variable.ts';
import { statusColorForUtcPlusSeven } from '../../helper/injection-token/status-color-for-utc-plus-seven.function.ts';
import { heroClockTransitionPicker } from '../../helper/injection-token/hero-clock-transition-picker.variable.ts';
import { calculateStatusLuminance } from '../../helper/injection-token/status-luminance.function.ts';
import { calculateHeroCodePosition } from '../../helper/injection-token/hero-code-position.function.ts';
import { FaviconService } from '../../helper/core/favicon.service.ts';
import { statusFaviconForStatusColor } from '../../helper/injection-token/status-favicon-for-status-color.function.ts';

/**
 * Hero section component introducing the candidate profile, providing animated orbital code badges,
 * displaying real-time Bangkok (UTC+7) availability status, and exposing primary contact actions.
 *
 * ### Dual-Rate Temporal Architecture
 * The component coordinates two asynchronous timing subsystems:
 * 1. **Discrete Clock Loop (1 Hz)**: Runs on a `setInterval` timer governed by `CLOCK_UPDATE_INTERVAL_MS`
 *    (default: 1000ms). Updates `currentInstant` and flips `isTickAlternate` to trigger CSS slide-and-fade
 *    keyframe transitions on every second boundary.
 * 2. **Continuous Physics Animation Loop (60/120 Hz)**: Driven by `requestAnimationFrame` and
 *    anchored against high-resolution timer baseline `performance.now()`. Computes continuous elapsed seconds
 *    $t_{\text{elapsed}} = (t_{\text{current}} - t_{\text{start}}) / 1000$ to evaluate:
 *    - Harmonic luminance pulsation: $L(t) = \text{clamp}(0.5 + A \cos(\omega t + \phi), 0, 1)$
 *    - Circular orbital badge paths: $x(t) = r A \cos(\omega t + \phi)$, $y(t) = r A \sin(\omega t + \phi)$
 *
 * ### Reactive State Coordination
 * - Derives availability status (`statusColor`) via `statusColorForUtcPlusSeven(currentInstant)`.
 * - Synchronizes the browser tab favicon reactively via `effect()` and `FaviconService`.
 * - Cleans up all active timer intervals and animation frame requests via `DestroyRef.onDestroy`.
 */
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
  private readonly theDocument = inject(DOCUMENT);

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

  /**
   * Initializes reactive status effects and registers DOM-dependent timer and animation loops
   * after the initial client-side render, releasing all resources upon component destruction.
   */
  constructor() {
    // Reactively update the browser favicon whenever the computed availability status color changes
    effect(() => {
      this.faviconService.setFavicon(this.statusFaviconForStatusColor(this.statusColor()));
    });

    // Defer DOM/Window-dependent timers and requestAnimationFrame until after initial client render
    afterNextRender(() => {
      // 1. Discrete clock ticker: updates time instant and toggles animation state every second
      const intervalId = this.theDocument.defaultView?.setInterval(() => {
        this.currentInstant.set(new Date());
        this.isTickAlternate.update((v) => !v);
      }, this.clockUpdateIntervalMs);

      let animationFrameId: number;
      // Capture high-resolution millisecond timestamp baseline for smooth delta-time kinematics
      const startTimestamp = performance.now();

      // 2. High-frequency continuous physics loop running on every display refresh (e.g. 60Hz/120Hz)
      const animateHeroVisuals = (currentTimestamp: DOMHighResTimeStamp) => {
        // Compute continuous elapsed time in seconds: t = (t_current - t_start) / 1000
        const elapsedSeconds = (currentTimestamp - startTimestamp) / 1000;

        // Update harmonic luminance oscillation signal
        this.statusLuminance.set(this.calculateStatusLuminanceFn(elapsedSeconds));

        // Update 2D orbital trajectory coordinates for both floating code badges
        const { left, right } = this.calculateHeroCodePositionFn(elapsedSeconds);
        this.leftCodePosition.set(left);
        this.rightCodePosition.set(right);

        // Schedule next animation frame if the window environment remains active
        if (this.theDocument.defaultView) {
          animationFrameId = this.theDocument.defaultView.requestAnimationFrame(animateHeroVisuals);
        }
      };

      // Kick off the initial animation loop frame
      if (this.theDocument.defaultView) {
        animationFrameId = this.theDocument.defaultView.requestAnimationFrame(animateHeroVisuals);
      }

      // Teardown lifecycle listener: clear interval and cancel pending animation frame to prevent leaks
      this.destroyRef.onDestroy(() => {
        this.theDocument.defaultView?.clearInterval(intervalId);
        this.theDocument.defaultView?.cancelAnimationFrame(animationFrameId);
      });
    });
  }

  /** @returns A direct email URI for the profile's public address. */
  protected emailHref(): string {
    return `mailto:${this.profile().details.email}`;
  }
}
