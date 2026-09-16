import { inject, InjectionToken } from '@angular/core';
import { linearizeChannel } from './linearize-channel.function.ts';

/**
 * Calculates the relative luminance ($Y$) of an sRGB color per the W3C WCAG 2.1
 * and ITU-R Recommendation BT.709-6 specifications.
 *
 * ### Mathematical Formulation
 * Given 8-bit non-linear color channels $(R, G, B) \in [0, 255]^3$:
 * 1. Linearize each channel into linear-light space via the sRGB transfer function:
 *    $$R_{\text{lin}} = \text{linearizeChannel}(R)$$
 *    $$G_{\text{lin}} = \text{linearizeChannel}(G)$$
 *    $$B_{\text{lin}} = \text{linearizeChannel}(B)$$
 *
 * 2. Compute the weighted photopic relative luminance scalar $Y \in [0.0, 1.0]$:
 *    $$Y = 0.2126 \cdot R_{\text{lin}} + 0.7152 \cdot G_{\text{lin}} + 0.0722 \cdot B_{\text{lin}}$$
 *
 * ### Spectral Sensitivity Rationale
 * The spectral weighting coefficients represent the human eye's photopic luminous
 * efficiency function $V(\lambda)$ under standard CIE D65 illumination:
 * - **Green ($0.7152$ / $\approx 71.5\%$):** Human M and L cone spectral overlap creates peak sensitivity in green wavelengths.
 * - **Red ($0.2126$ / $\approx 21.3\%$):** Moderate spectral sensitivity.
 * - **Blue ($0.0722$ / $\approx 7.2\%$):** Lowest photopic sensitivity due to sparse S-cone retinal distribution.
 *
 * ### Application in WCAG Contrast
 * The resulting luminance $Y$ determines the contrast ratio between two colors:
 * $$\text{Contrast Ratio} = \frac{\max(Y_1, Y_2) + 0.05}{\min(Y_1, Y_2) + 0.05}$$
 * where $+0.05$ represents the flare light compensation constant.
 *
 * @param red 8-bit sRGB red component [0, 255].
 * @param green 8-bit sRGB green component [0, 255].
 * @param blue 8-bit sRGB blue component [0, 255].
 * @returns Relative luminance scalar normalized to [0.0, 1.0] (0 = darkest black, 1 = brightest white).
 */
export const relativeLuminance = new InjectionToken<
  (red: number, green: number, blue: number) => number
>('relativeLuminance', {
  providedIn: 'root',
  factory: () => {
    const fn = (linearizeChannel: (channel: number) => number) => {
      return (red: number, green: number, blue: number): number => {
        // Compute linear photon energy weighted by human photopic spectral sensitivity
        return (
          0.2126 * linearizeChannel(red) +
          0.7152 * linearizeChannel(green) +
          0.0722 * linearizeChannel(blue)
        );
      };
    };

    return fn(inject(linearizeChannel));
  },
});
