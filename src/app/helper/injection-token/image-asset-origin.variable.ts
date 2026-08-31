import { InjectionToken } from '@angular/core';

/** Public origin that serves every project-owned runtime image. */
export const IMAGE_ASSET_ORIGIN = new InjectionToken<string>('IMAGE_ASSET_ORIGIN', {
  providedIn: 'root',
  factory: () => 'https://resume-images.ohm-mho.space',
});
