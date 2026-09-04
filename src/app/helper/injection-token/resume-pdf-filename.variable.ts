import { InjectionToken } from '@angular/core';

export const RESUME_PDF_FILENAME = new InjectionToken<string>('RESUME_PDF_FILENAME', {
  providedIn: 'root',
  factory: () => 'nawaphon-isarathanachaikul-resume-profile.pdf',
});
