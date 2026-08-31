import {inject, InjectionToken} from '@angular/core';
import {IMAGE_ASSET_ORIGIN} from './image-asset-origin.variable.ts';


export const imageAssetUrl = new InjectionToken<string>(
  'imageAssetUrl',
  {
    providedIn: 'root',
    factory: () => inject(IMAGE_ASSET_ORIGIN),
  }
);
