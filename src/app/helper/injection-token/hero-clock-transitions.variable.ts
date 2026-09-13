import { InjectionToken } from '@angular/core';
import type { HeroClockTransition } from '../type/hero-clock-transistion.type.ts';

export const HERO_CLOCK_TRANSITIONS = new InjectionToken<readonly HeroClockTransition[]>(
  'HERO_CLOCK_TRANSITIONS',
  {
    providedIn: 'root',
    factory: () => ['slide-fade', 'opacity-pulse', 'soft-glow'],
  },
);
