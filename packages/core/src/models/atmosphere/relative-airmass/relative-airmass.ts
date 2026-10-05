/** Relative air-mass models available in {@link relativeAirmass} (pvlib names). */
export type AirmassModel =
  | "simple"
  | "kasten1966"
  | "youngirvine1967"
  | "kastenyoung1989"
  | "gueymard1993"
  | "young1994"
  | "pickering2002"
  | "gueymard2003";

/** Inputs for {@link relativeAirmass}. */
export interface RelativeAirmassInput {
  /**
   * Solar zenith angle, degrees. Apparent (refraction-corrected, sea level) zenith for
   * every model except `youngirvine1967` and `young1994`, which take the true zenith.
   */
  solarZenith: number;
  /** Air-mass model. Default `"kastenyoung1989"`. */
  model?: AirmassModel;
}

const D2R = Math.PI / 180;

/**
 * Relative (not pressure-adjusted) optical air mass at sea level. Unitless; `NaN` for
 * solarZenith > 90° (sun below the horizon), as pvlib.
 *
 * @example
 * relativeAirmass({ solarZenith: 60 }); // ≈ 1.9943 (Kasten & Young 1989)
 */
export const relativeAirmass = (input: RelativeAirmassInput): number => {
  const { solarZenith, model = "kastenyoung1989" } = input;
  const z = solarZenith > 90 ? Number.NaN : solarZenith;
  const cz = Math.cos(z * D2R);
  switch (model) {
    case "kastenyoung1989":
      return 1 / (cz + 0.50572 * (6.07995 + (90 - z)) ** -1.6364);
    case "kasten1966":
      return 1 / (cz + 0.15 * (93.885 - z) ** -1.253);
    case "simple":
      return 1 / cz;
    case "pickering2002":
      return 1 / Math.sin((90 - z + 244 / (165 + 47 * (90 - z) ** 1.1)) * D2R);
    case "youngirvine1967": {
      const sec = 1 / cz;
      return sec * (1 - 0.0012 * (sec * sec - 1));
    }
    case "young1994":
      return (
        (1.002432 * cz ** 2 + 0.148386 * cz + 0.0096467) /
        (cz ** 3 + 0.149864 * cz ** 2 + 0.0102963 * cz + 0.000303978)
      );
    case "gueymard1993":
      return 1 / (cz + 0.00176759 * z * (94.37515 - z) ** -1.21563);
    case "gueymard2003":
      return 1 / (cz + (0.48353 * z ** 0.095846) / (96.741 - z) ** 1.754);
    default:
      throw new RangeError(`unknown air-mass model: ${model as string}`);
  }
};
