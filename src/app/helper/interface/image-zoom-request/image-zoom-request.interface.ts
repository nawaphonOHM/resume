import type { BrandLogo } from '../brand-logo/brand-logo.interface.ts';
import type { ImageZoomActivation } from '../../type/image-zoom-activation.type.ts';

/** Complete request for opening a logo preview beside its rendered image. */
export interface ImageZoomRequest {
  /** Rendered image that owns and anchors the overlay. */
  readonly origin: HTMLImageElement;

  /** Intrinsic asset and surface metadata rendered by the preview. */
  readonly logo: BrandLogo;

  /** Descriptive alternative text copied to the enlarged image. */
  readonly label: string;

  /** Exact preview surface override; omission retains the logo tone's standard card color. */
  readonly background?: string;

  /** Interaction mode used for ownership checks and pane pointer behavior. */
  readonly activation: ImageZoomActivation;
}
