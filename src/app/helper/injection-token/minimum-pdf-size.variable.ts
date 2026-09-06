import { InjectionToken } from '@angular/core';

export const MINIMUM_PDF_SIZE = new InjectionToken<number>('MINIMUM_PDF_SIZE', {
  providedIn: 'root',
  factory: () => 10_000,
});
