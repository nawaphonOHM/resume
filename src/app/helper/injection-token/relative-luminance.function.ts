import {inject, InjectionToken} from '@angular/core';
import {linearizeChannel} from './linearize-channel.function.ts';


/** Calculates WCAG relative luminance for an RGB pixel. */
export const relativeLuminance = new InjectionToken<(red: number, green: number, blue: number) => number>(
  'relativeLuminance',
  {
    providedIn: 'root',
    factory: () => {
      const fn = (linearizeChannel: (channel: number) => number) => {
        return (red: number, green: number, blue: number): number => {
          return (
            0.2126 * linearizeChannel(red) +
            0.7152 * linearizeChannel(green) +
            0.0722 * linearizeChannel(blue)
          );
        }
      }

      return fn(inject(linearizeChannel));
    }
  }
)
