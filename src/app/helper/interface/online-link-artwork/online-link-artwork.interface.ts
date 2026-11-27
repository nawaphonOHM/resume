import type {BrandLogo} from '../brand-logo/brand-logo.interface.ts';
import type {TechnologyIconBackgroundColor} from '../../type/technology-icon-background-color.type.ts';

export interface OnlineLinkArtwork {
  readonly original: BrandLogo;
  readonly enhanced?: BrandLogo;
  readonly originalSurface: TechnologyIconBackgroundColor;
  readonly enhancedSurface: TechnologyIconBackgroundColor;
}
