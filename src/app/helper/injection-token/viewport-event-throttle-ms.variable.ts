import { InjectionToken } from '@angular/core';

export const VIEWPORT_EVENT_THROTTLE_MS = new InjectionToken<number>('viewport-event-throttle-ms', {
  providedIn: 'root',
  factory: () => 100,
});
