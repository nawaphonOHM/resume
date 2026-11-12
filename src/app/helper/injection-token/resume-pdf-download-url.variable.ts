import { inject, InjectionToken } from '@angular/core';
import { assetUrlBuilder } from './asset-url-builder.function.ts';

export const RESUME_PDF_DOWNLOAD_URL = new InjectionToken<string>('RESUME_PDF_DOWNLOAD_URL', {
  providedIn: 'root',
  factory: () => inject(assetUrlBuilder).file('Nawaphon_Isarathanachaikul.pdf'),
});
