/** Rendering metadata for brand artwork and its contrast-preserving frame. */
export interface BrandLogo {
  /** Asset URL loaded by logo images and zoom previews. */
  readonly src: string;

  /** Intrinsic asset width in pixels, used to preserve its aspect ratio. */
  readonly width: number;

  /** Intrinsic asset height in pixels, used to preserve its aspect ratio. */
  readonly height: number;

  /** Background tone on which the artwork retains its intended contrast. */
  readonly surface: 'light' | 'dark';
}
