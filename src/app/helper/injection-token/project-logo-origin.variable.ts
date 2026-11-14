import { InjectionToken } from '@angular/core';

export const PROJECT_LOGO_ORIGIN = new InjectionToken<string>('PROJECT_LOGO_ORIGIN', {
  providedIn: 'root',
  factory: () => 'https://ohm-mho.space',
});
