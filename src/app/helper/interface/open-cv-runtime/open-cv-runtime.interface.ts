import type {OpenCvMat} from '../disposable/deletable/open-cv-mat/open-cv-mat.interface.ts';
import type {OpenCvMatVector} from '../disposable/deletable/open-cv-mat-vector/open-cv-mat-vector.interface.ts';
import type {OpenCvSize} from '../disposable/open-cv-size/open-cv-size.interface.ts';
import type {OpenCvClahe} from '../disposable/deletable/open-cv-clahe/open-cv-clahe.interface.ts';


export interface OpenCvRuntime {
  readonly Mat: new () => OpenCvMat;
  readonly MatVector: new () => OpenCvMatVector;
  readonly Size: new (width: number, height: number) => OpenCvSize;
  readonly CLAHE: new (clipLimit: number, tileGridSize: OpenCvSize) => OpenCvClahe;
  readonly COLOR_RGBA2RGB: number;
  readonly COLOR_RGB2Lab: number;
  readonly COLOR_Lab2RGB: number;
  matFromImageData(imageData: ImageData): OpenCvMat;
  cvtColor(source: OpenCvMat, destination: OpenCvMat, code: number): void;
  split(source: OpenCvMat, destination: OpenCvMatVector): void;
  merge(source: OpenCvMatVector, destination: OpenCvMat): void;
}
