import { InjectionToken } from '@angular/core';

export const METADATA_DATE = new InjectionToken<string>('METADATA_DATE', {
  providedIn: 'root',
  factory: () => '2026-01-01T00:00:00.000Z',
});
