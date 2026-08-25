import type { Deletable } from '../deletable.interface.ts';

export interface OpenCvMat extends Deletable {
  readonly data: ArrayLike<number>;
}
