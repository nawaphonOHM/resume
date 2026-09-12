import type { ConnectedPosition } from '@angular/cdk/overlay';
import { inject, InjectionToken } from '@angular/core';
import { ORIGIN_GAP } from './origin-gap.variable.ts';

/** Connected placement fallbacks tried in right, left, below, then above order. */
export const IMAGE_ZOOM_POSITIONS = new InjectionToken<readonly ConnectedPosition[]>(
  'IMAGE_ZOOM_POSITIONS',
  {
    providedIn: 'root',
    factory: () => {
      const fn = (originGap: number) => {
        return [
          {
            originX: 'end',
            originY: 'center',
            overlayX: 'start',
            overlayY: 'center',
            offsetX: originGap,
          },
          {
            originX: 'start',
            originY: 'center',
            overlayX: 'end',
            overlayY: 'center',
            offsetX: -originGap,
          },
          {
            originX: 'center',
            originY: 'bottom',
            overlayX: 'center',
            overlayY: 'top',
            offsetY: originGap,
          },
          {
            originX: 'center',
            originY: 'top',
            overlayX: 'center',
            overlayY: 'bottom',
            offsetY: -originGap,
          },
        ] as readonly ConnectedPosition[];
      };

      return fn(inject(ORIGIN_GAP));
    },
  },
);
