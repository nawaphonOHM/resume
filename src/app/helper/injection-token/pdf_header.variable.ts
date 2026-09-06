import { InjectionToken } from '@angular/core';

export const PDF_HEADER = new InjectionToken<readonly number[]>('PDF_HEADER', {
  providedIn: 'root',
  factory: () => [0x25, 0x50, 0x44, 0x46, 0x2d] as const,
});
