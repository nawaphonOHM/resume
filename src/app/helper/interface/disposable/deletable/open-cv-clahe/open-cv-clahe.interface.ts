import type { Deletable } from '../deletable.interface.ts';
import type { OpenCvMat } from '../open-cv-mat/open-cv-mat.interface.ts';

export interface OpenCvClahe extends Deletable {
  apply(source: OpenCvMat, destination: OpenCvMat): void;
  collectGarbage?(): void;
}
