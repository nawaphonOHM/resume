import { InjectionToken } from '@angular/core';
import type { COLOR_TYPE } from '../type/colors.type.ts';

export const COLORS = new InjectionToken<COLOR_TYPE>('COLORS', {
  providedIn: 'root',
  factory: () => ({
    navy: '#102a43',
    accent: '#2f80ed',
    text: '#243b53',
    muted: '#627d98',
    border: '#d9e2ec',
    surface: '#f0f4f8',
    white: '#ffffff',
  }),
});
