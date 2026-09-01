import { InjectionToken } from '@angular/core';

/** Pads one numeric date field to its display width. */
export const padDateTimePart = new InjectionToken<(value: number, length: number) => string>(
  'padDateTimePart',
  {
    providedIn: 'root',
    factory: () => {
      return (value: number, length = 2): string => {
        return value.toString().padStart(length, '0');
      };
    },
  },
);
