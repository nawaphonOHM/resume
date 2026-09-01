import {InjectionToken} from '@angular/core';



/** Confirmed colors for available, limited, and unavailable UTC+7 periods. */
export const STATUS_COLORS_TOKEN = new InjectionToken(
  'STATUS_COLORS',
  {
    providedIn: 'root',
    factory: () => ({
      available: '#92C353',
      limited: '#F7A600',
      unavailable: '#D1D1D1',
    })
  }
)

export type STATUS_COLORS = {
  available: string;
  limited: string;
  unavailable: string;
}
