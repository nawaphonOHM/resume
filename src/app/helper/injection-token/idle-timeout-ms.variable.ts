import {InjectionToken} from '@angular/core';


export const IDLE_TIMEOUT_MS = new InjectionToken<number>('IDLE_TIMEOUT_MS', {
  providedIn: 'root',
  factory: () => 1_000,
});
