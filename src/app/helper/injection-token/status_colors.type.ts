import { InjectionToken } from '@angular/core';

/** One of the normalized colors supported by the availability indicator. */
export type StatusColor = (STATUS_COLORS)[keyof STATUS_COLORS];

/** Confirmed colors for available, limited, and unavailable UTC+7 periods. */
// export const STATUS_COLORS = {
//   available: '#92C353',
//   limited: '#F7A600',
//   unavailable: '#D1D1D1',
// } as const;

/** Confirmed colors for available, limited, and unavailable UTC+7 periods. */
export type STATUS_COLORS = {
  available: string;
  limited: string;
  unavailable: string;
}
