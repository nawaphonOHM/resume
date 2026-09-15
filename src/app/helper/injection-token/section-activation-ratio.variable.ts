import { InjectionToken } from '@angular/core';

export const SECTION_ACTIVATION_RATIO = new InjectionToken<number>('SECTION_ACTIVATION_RATIO', {
  providedIn: 'root',
  factory: () => 0.18,
});
