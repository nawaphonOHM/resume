import { InjectionToken } from '@angular/core';

/**
 * Converts an 8-bit sRGB color channel value [0, 255] into its linearized
 * photon-energy equivalent [0.0, 1.0] using the standard IEC 61966-2-1
 * electro-optical transfer function (EOTF).
 *
 * ### Mathematical Formulation
 * Given an 8-bit sRGB channel $C_{\text{srgb}} \in [0, 255]$:
 * 1. Normalize to the unit interval $[0.0, 1.0]$:
 *    $$u = \frac{C_{\text{srgb}}}{255}$$
 *
 * 2. Apply the piecewise sRGB gamma expansion:
 *    $$C_{\text{linear}} = \begin{cases}
 *      \frac{u}{12.92} & \text{if } u \le 0.04045 \\
 *      \left(\frac{u + 0.055}{1.055}\right)^{2.4} & \text{if } u > 0.04045
 *    \end{cases}$$
 *
 * ### Rationale
 * - **Linear Segment ($u \le 0.04045$):** Prevents an infinite derivative (infinite slope)
 *   at zero, mitigating digital sensor noise amplification in deep shadows.
 * - **Exponential Segment ($u > 0.04045$):** A power curve with an offset of 0.055 and
 *   an exponent of 2.4, approximating an overall effective gamma curve of $\gamma \approx 2.2$.
 *
 * @param channel The 8-bit integer channel value (0 to 255).
 * @returns The linearized photopic scalar in the range [0.0, 1.0].
 */
export const linearizeChannel = new InjectionToken<(channel: number) => number>(
  'linearizeChannel',
  {
    providedIn: 'root',
    factory:
      () =>
      (channel: number): number => {
        // Step 1: Normalize 8-bit unsigned integer to the unit range [0.0, 1.0]
        const normalized = channel / 255;

        // Step 2: Piecewise expansion per IEC 61966-2-1 specification
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      },
  },
);
