/** Public origin that serves every project-owned runtime image. */
export const IMAGE_ASSET_ORIGIN = 'https://resume-images.ohm-mho.space';

/** Builds an absolute Space URL while preserving the image web-path layout. */
export function imageAssetUrl(path: ImageAssetPath): string {
  return `${IMAGE_ASSET_ORIGIN}${path}`;
}
