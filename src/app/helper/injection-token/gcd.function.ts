import {InjectionToken} from '@angular/core';


/**
 * Calculates the greatest common divisor (GCD) of two numbers using the Euclidean algorithm.
 * Operates on absolute rounded integer values with fallback to 1.
 *
 * Used to reduce the orbital revolution ratio `rLeft / rRight` to its lowest coprime terms,
 * ensuring the computed combined orbital cycle period is minimal (fundamental).
 */
export const GCD = new InjectionToken<(a: number, b: number) => number>('gcd', {
  providedIn: 'root',
  factory: () => {
    return (a: number, b: number): number => {
      let x = Math.abs(Math.round(a));
      let y = Math.abs(Math.round(b));
      while (y !== 0) {
        const temp = y;
        y = x % y;
        x = temp;
      }
      return x || 1;
    }
  }
});
