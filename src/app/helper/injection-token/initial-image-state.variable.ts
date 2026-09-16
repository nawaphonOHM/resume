import { InjectionToken } from '@angular/core';

/** Unmeasured state used until the host image reaches its first browser render. */
export const INITIAL_IMAGE_STATE = new InjectionToken<ImageState>('INITIAL_IMAGE_STATE', {
  providedIn: 'root',
  factory: () => ({
    failed: false,
    naturalSize: null,
    contentBoxSize: null,
  }),
});
