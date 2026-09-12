import type { BrandLogo } from '../brand-logo/brand-logo.interface.ts';

/** Immutable content supplied to an overlay-hosted image preview. */
export interface ImageZoomPreviewData {
  /** Intrinsic asset and contrast-surface metadata for the enlarged image. */
  readonly logo: BrandLogo;

  /** Descriptive alternative text retained on the enlarged image. */
  readonly label: string;

  /** Exact card color override; omission preserves the logo surface's existing default. */
  readonly background?: string;
}
