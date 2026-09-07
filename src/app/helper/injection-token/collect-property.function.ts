import { InjectionToken } from '@angular/core';

export const collectProperty = new InjectionToken<
  (value: unknown, propertyName: string) => string[]
>('collectProperty', {
  providedIn: 'root',
  factory: () => {
    const fn = (value: unknown, propertyName: string): string[] => {
      if (Array.isArray(value)) {
        return value.flatMap((entry) => fn(entry, propertyName));
      }

      if (!value || typeof value !== 'object') {
        return [];
      }

      return Object.entries(value).flatMap(([key, entry]) => [
        ...(key === propertyName && typeof entry === 'string' ? [entry] : []),
        ...fn(entry, propertyName),
      ]);
    };

    return fn;
  },
});
