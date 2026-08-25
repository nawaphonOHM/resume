import {InjectionToken} from '@angular/core';

/** Converts one sRGB channel to its linear-light value. */
export const linearizeChannel = new InjectionToken<(channel: number) => number>(
  "linearizeChannel",
  {
    providedIn: 'root',
    factory: () => (channel: number): number => {
      const normalized = channel / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    }
  }
);
