import {InjectionToken} from '@angular/core';

/** Returns whether an unknown module value is promise-like. */
export const isPromiseLike = new InjectionToken<(value: unknown) => value is PromiseLike<unknown>>(
  'isPromiseLike',
  {
    providedIn: 'root',
    factory: () => {
      return (value: unknown): value is PromiseLike<unknown> => {
        return (
          ((typeof value === 'object' && value !== null) || typeof value === 'function') &&
          typeof (value as PromiseLike<unknown>).then === 'function'
        );
      }
    },
  }
)
