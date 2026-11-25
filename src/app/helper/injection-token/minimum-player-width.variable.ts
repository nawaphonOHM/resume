import { InjectionToken } from '@angular/core';

export const MINIMUM_PLAYER_WIDTH = new InjectionToken('MINIMUM_PLAYER_WIDTH', {
  providedIn: 'root',
  factory: () => 200,
});
