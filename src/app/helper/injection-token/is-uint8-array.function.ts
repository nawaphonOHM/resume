import { InjectionToken } from '@angular/core';

export const isUint8Array = new InjectionToken<(value: unknown) => value is Uint8Array>(
  'isUint8Array',
  {
    providedIn: 'root',
    factory: () => {
      return (value: unknown): value is Uint8Array => {
        return (
          ArrayBuffer.isView(value) &&
          Object.prototype.toString.call(value) === '[object Uint8Array]'
        );
      };
    },
  },
);
