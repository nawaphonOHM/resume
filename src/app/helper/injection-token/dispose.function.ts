import { InjectionToken } from '@angular/core';
import type { Disposable } from '../interface/disposable/disposable.interface.ts';

/** Best-effort native allocation cleanup that cannot mask the usable fallback. */
export const dispose = new InjectionToken<(allocation: Disposable | undefined) => void>('dispose', {
  providedIn: 'root',
  factory: () => (allocation: Disposable | undefined) => {
    try {
      allocation?.delete?.();
    } catch {
      // A failed native cleanup must not surface as an application error.
    }
  },
});
