import type { ImageSize } from '../image-size/imgae-size.interface.ts';

/** Atomic snapshot of browser-measured image state used by reactive eligibility derivation. */
export interface ImageState {
  readonly failed: boolean;
  readonly naturalSize: ImageSize | null;
  readonly contentBoxSize: ImageSize | null;
}
