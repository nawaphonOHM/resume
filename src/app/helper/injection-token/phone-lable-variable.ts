import { InjectionToken } from '@angular/core';

export const PHONE_LABEL = new InjectionToken<string>('PHONE_LABEL', {
  providedIn: 'root',
  factory: () => 'Available on request',
});
