import { InjectionToken } from '@angular/core';

export const BROWSER_FONT = new InjectionToken<string>('BROWSER_FONT', {
  providedIn: 'root',
  factory: () => 'Roboto',
});
