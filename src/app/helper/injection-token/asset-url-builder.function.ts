import { inject, InjectionToken } from '@angular/core';
import { IMAGE_ASSET_ORIGIN } from './image-asset-origin.variable.ts';
import type { AssetUrlBuilder } from '../interface/asset-url-builder/asset-url-builder.interface.ts';

export function createAssetUrlBuilder(origin: string): AssetUrlBuilder {
  const assetPath = `${origin.replace(/\/+$/, '')}/assets`;

  return {
    file: (fileName) => `${assetPath}/${encodeURIComponent(fileName)}`,
    favicon: (status) =>
      `${assetPath}/favicon.svg?${encodeURIComponent(JSON.stringify({ status }))}`,
  };
}

export const assetUrlBuilder = new InjectionToken<AssetUrlBuilder>('assetUrlBuilder', {
  providedIn: 'root',
  factory: () => createAssetUrlBuilder(inject(IMAGE_ASSET_ORIGIN)),
});
