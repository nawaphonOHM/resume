/** Atomic snapshot of browser-measured image state used by reactive eligibility derivation. */
interface ImageState {
  readonly failed: boolean;
  readonly naturalSize: ImageSize | null;
  readonly contentBoxSize: ImageSize | null;
}
