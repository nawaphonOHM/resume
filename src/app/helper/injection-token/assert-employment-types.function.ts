import { inject, InjectionToken } from '@angular/core';
import { SUPPORTED_EMPLOYMENT_TYPES } from './supported-employment-types.variable.ts';

export const assertEmploymentTypes = new InjectionToken<
  (value: unknown, fieldName: string) => void
>('assertEmploymentTypes', {
  providedIn: 'root',
  factory: () => {
    const fn = (supportedEmploymentTypes: Set<string>) => {
      return (value: unknown, fieldName: string): void => {
        if (!Array.isArray(value) || value.length === 0) {
          throw new Error(`The résumé ${fieldName} must contain at least one item.`);
        }

        for (const [index, employmentType] of value.entries()) {
          if (typeof employmentType !== 'string' || !supportedEmploymentTypes.has(employmentType)) {
            throw new Error(
              `The résumé ${fieldName}[${index}] must be a supported employment type.`,
            );
          }
        }
      };
    };

    return fn(inject(SUPPORTED_EMPLOYMENT_TYPES));
  },
});
