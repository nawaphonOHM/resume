import { InjectionToken } from '@angular/core';

export const RESUME_PDF_DOWNLOAD_URL = new InjectionToken<string>('RESUME_PDF_DOWNLOAD_URL', {
  providedIn: 'root',
  factory: () => '/downloadable-resume/Nawaphon_Isarathanachaikul.pdf',
});
