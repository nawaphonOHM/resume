import { InjectionToken } from '@angular/core';

export const REQUIRED_ROBOTO_FONTS = new InjectionToken<string[]>('REQUIRED_ROBOTO_FONTS', {
  providedIn: 'root',
  factory: () => {
    return [
      'Roboto-Regular.ttf',
      'Roboto-Medium.ttf',
      'Roboto-Italic.ttf',
      'Roboto-MediumItalic.ttf',
    ];
  },
});
