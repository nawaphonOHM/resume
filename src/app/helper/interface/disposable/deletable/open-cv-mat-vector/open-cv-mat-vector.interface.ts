import type { Deletable } from '../deletable.interface.ts';
import type { OpenCvMat } from '../open-cv-mat/open-cv-mat.interface.ts';

export interface OpenCvMatVector extends Deletable {
  get(index: number): OpenCvMat;
  push_back(mat: OpenCvMat): unknown;
}
