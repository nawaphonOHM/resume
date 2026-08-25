import {InjectionToken} from '@angular/core';


/** Unwraps a default value exposed by an imported module. */
export const unwrapDefaultExport = new InjectionToken<(value: unknown) => unknown>(
  'unwrapDefaultExport',
  {
    providedIn: 'root',
    factory: () => {
      return (value: unknown): unknown => {
        if (typeof value !== 'object' || value === null || !('default' in value)) {
          return value;
        }

        const defaultExport = (value as { readonly default?: unknown }).default;
        return defaultExport === undefined || defaultExport === value ? value : defaultExport;
      };
    },
  }
)
