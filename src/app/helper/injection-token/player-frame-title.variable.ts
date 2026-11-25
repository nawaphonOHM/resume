import { InjectionToken } from '@angular/core';

export const PLAYER_FRAME_TITLE = new InjectionToken('PLAYER_FRAME_TITLE', {
  providedIn: 'root',
  factory: () => 'Never Gonna Give You Up by Rick Astley — YouTube video',
});
