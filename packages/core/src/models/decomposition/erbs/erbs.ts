import { clearnessIndex, spencerDniExtra } from "../clearness-index/clearness-index.ts";

const D2R = Math.PI / 180;

/** Inputs for {@link erbs}. Give `timeMs` or `dniExtra`. */
export interface ErbsInput {
  /** Global horizontal irradiance, W/m². */
  ghi: number;
  /** True (not refraction-corrected) solar zenith, degrees. */
  solarZenith: number;
  /** Instant as UTC epoch ms; sets `dniExtra` (Spencer, solar constant 1366.1 W/m²). */
  timeMs?: number;
  /** Extraterrestrial normal irradiance, W/m². Takes precedence over `timeMs`. */
  dniExtra?: number;
  /** Floor on cos(zenith) when computing kt. Default 0.065. */
  minCosZenith?: number;
  /** Above this zenith (degrees) DNI is set to 0 and DHI to GHI. Default 87. */
  maxZenith?: number;
}

/** Decomposed irradiance. */
export interface ErbsResult {
  /** Direct normal irradiance, W/m². */
  dni: number;
  /** Diffuse horizontal irradiance, W/m². */
  dhi: number;
  /** Clearness index (clipped to [0, 1]). */
  kt: number;
}

/** @internal kt with max 1, shared by erbs/boland. */
export const decompositionKt = (input: ErbsInput): number => {
  const { ghi, solarZenith, timeMs, dniExtra, minCosZenith = 0.065 } = input;
  let i0 = dniExtra;
  if (i0 === undefined) {
    if (timeMs === undefined) throw new RangeError("give timeMs or dniExtra");
    i0 = spencerDniExtra(timeMs, 1366.1);
  }
  return clearnessIndex({ ghi, solarZenith, dniExtra: i0, minCosZenith, maxClearnessIndex: 1 });
};

/**
 * @internal DHI = df·GHI, DNI = (GHI − DHI)/cos z; where zenith > maxZenith, GHI < 0 or
 * DNI < 0 → DNI 0, DHI = GHI (pvlib closure guard).
 */
export const splitByDiffuseFraction = (
  ghi: number,
  solarZenith: number,
  maxZenith: number,
  diffuseFraction: number,
  kt: number,
): ErbsResult => {
  const dhi = diffuseFraction * ghi;
  const dni = (ghi - dhi) / Math.cos(solarZenith * D2R);
  if (solarZenith > maxZenith || ghi < 0 || dni < 0) return { dni: 0, dhi: ghi, kt };
  return { dni, dhi, kt };
};

/**
 * Erbs, Klein & Duffie (1982) diffuse-fraction correlation: GHI → DNI, DHI
 * (pvlib `irradiance.erbs`).
 *
 * @example
 * erbs({ ghi: 500, solarZenith: 30, timeMs: Date.UTC(2024, 5, 10) });
 */
export const erbs = (input: ErbsInput): ErbsResult => {
  const { ghi, solarZenith, maxZenith = 87 } = input;
  const kt = decompositionKt(input);
  let df: number;
  if (kt <= 0.22) df = 1 - 0.09 * kt;
  else if (kt <= 0.8)
    df = 0.9511 - 0.1604 * kt + 4.388 * kt ** 2 - 16.638 * kt ** 3 + 12.336 * kt ** 4;
  else df = 0.165;
  return splitByDiffuseFraction(ghi, solarZenith, maxZenith, df, kt);
};
