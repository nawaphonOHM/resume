import type { ResumePdfCdnAsset } from '../resume-pdf-cdn-asset/resume-pdf-cdn-asset.interface.ts';

/** Browser script loader that shares exact-URL loads and can evict stale assets. */
export interface ResumePdfCdnScriptLoader {
  load(asset: ResumePdfCdnAsset): Promise<void>;
  invalidate(asset: ResumePdfCdnAsset): void;
}
