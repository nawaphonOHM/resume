import { InjectionToken } from '@angular/core';

/** Panel padding (0.75rem * 2) + border (1px * 2), matching `image-zoom-preview-preview.scss`. */
export const PANEL_CHROME_PX = new InjectionToken<number>('PANEL_CHROME_PX', {
  providedIn: 'root',
  factory: () => 26,
});
