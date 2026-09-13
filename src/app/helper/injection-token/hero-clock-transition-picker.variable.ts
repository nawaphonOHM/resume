import { inject, InjectionToken } from '@angular/core';
import type { HeroClockTransition } from '../type/hero-clock-transistion.type.ts';
import { HERO_CLOCK_TRANSITIONS } from './hero-clock-transitions.variable.ts';

/** Returns a randomly selected visual transition effect for the hero clock. */
export const heroClockTransitionPicker = new InjectionToken<() => HeroClockTransition>(
  'heroClockTransitionPicker',
  {
    providedIn: 'root',
    factory: () => () => {
      const fn = (heroClockTransitions: readonly HeroClockTransition[]) => {
        return heroClockTransitions[Math.floor(Math.random() * heroClockTransitions.length)];
      };

      return fn(inject(HERO_CLOCK_TRANSITIONS));
    },
  },
);
