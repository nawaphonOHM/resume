import type { AssetStatus } from '../../type/asset-status.type.ts';

export interface AssetUrlBuilder {
  file(fileName: string): string;
  favicon(status: AssetStatus): string;
}
