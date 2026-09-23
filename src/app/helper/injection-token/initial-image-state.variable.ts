import { InjectionToken } from '@angular/core';
import type { ImageState } from '../interface/image-state/image-state.interface.ts';

/** Unmeasured state used until the host image reaches its first browser render. */
export const INITIAL_IMAGE_STATE = new InjectionToken<ImageState>('INITIAL_IMAGE_STATE', {
  providedIn: 'root',
  factory: () => ({
    failed: false,
    naturalSize: null,
    contentBoxSize: null,
  }),
});
