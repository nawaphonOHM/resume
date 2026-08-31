import type {BrandLogo} from '../brand-logo.interface.ts';


/** Remote SVG metadata used to decorate a technology label. */
export interface TechnologyIconMetadata extends BrandLogo {
  /** Absolute Space URL generated from a compile-time constrained image path. */
  readonly src: string;
}
