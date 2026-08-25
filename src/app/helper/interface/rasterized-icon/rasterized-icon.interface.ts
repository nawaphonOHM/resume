

export interface RasterizedIcon {
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  readonly pixels: Uint8ClampedArray;
}
