import { InjectionToken } from '@angular/core';

export const PHONE_PATTERN = new InjectionToken<RegExp>('PHONE_PATTERN', {
  providedIn: 'root',
  factory: () => /(?:\+?66|0[689])[\s().-]*(?:\d[\s().-]*){8}/,
});
