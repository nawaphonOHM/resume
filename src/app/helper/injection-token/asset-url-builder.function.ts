import { inject, InjectionToken } from '@angular/core';
import { IMAGE_ASSET_ORIGIN } from './image-asset-origin.variable.ts';

export type AssetStatus = 'available' | 'limited' | 'unavailable';

export interface AssetUrlBuilder {
  file(fileName: string): string;
  favicon(status: AssetStatus): string;
}

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
