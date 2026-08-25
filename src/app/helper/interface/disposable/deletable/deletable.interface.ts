import type { Disposable } from '../disposable.interface.ts';

export interface Deletable extends Disposable {
  delete(): unknown;
}
