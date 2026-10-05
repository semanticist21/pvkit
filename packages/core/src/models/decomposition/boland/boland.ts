import {
  decompositionKt,
  type ErbsInput,
  type ErbsResult,
  splitByDiffuseFraction,
} from "../erbs/erbs.ts";

/** Inputs for {@link boland}. Give `timeMs` or `dniExtra`. */
export interface BolandInput extends ErbsInput {
  /** Logistic coefficient a. Default 8.645 (15-min fit; 1-hour fit: 7.997). */
  aCoeff?: number;
  /** Logistic coefficient b. Default 0.613 (15-min fit; 1-hour fit: 0.586). */
  bCoeff?: number;
}

/** Decomposed irradiance (DNI, DHI W/m²; kt clipped to [0, 1]). */
export type BolandResult = ErbsResult;

/**
 * Boland, Scott & Luther (2001) logistic diffuse fraction `df = 1 / (1 + e^{a(kt − b)})`:
 * GHI → DNI, DHI (pvlib `irradiance.boland`).
 *
 * @example
 * boland({ ghi: 500, solarZenith: 30, timeMs: Date.UTC(2024, 5, 10) });
 */
export const boland = (input: BolandInput): BolandResult => {
  const { ghi, solarZenith, maxZenith = 87, aCoeff = 8.645, bCoeff = 0.613 } = input;
  const kt = decompositionKt(input);
  const df = 1 / (1 + Math.exp(aCoeff * (kt - bCoeff)));
  return splitByDiffuseFraction(ghi, solarZenith, maxZenith, df, kt);
};
