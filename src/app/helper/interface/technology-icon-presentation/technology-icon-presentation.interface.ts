import type {BrandLogo} from '../brand-logo/brand-logo.interface.ts';
import type {TechnologyIconBackgroundColor} from '../../type/technology-icon-background-color.type.ts';


/** Resolved artwork and the exact card surface on which it was evaluated. */
export interface TechnologyIconPresentation {
  readonly logo: BrandLogo;
  readonly backgroundColor: TechnologyIconBackgroundColor;
}
