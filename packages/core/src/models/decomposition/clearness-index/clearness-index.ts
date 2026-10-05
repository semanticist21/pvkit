const D2R = Math.PI / 180;
const MS_PER_DAY = 86_400_000;

/** Inputs for {@link clearnessIndex}. */
export interface ClearnessIndexInput {
  /** Global horizontal irradiance, W/m². */
  ghi: number;
  /** True (not refraction-corrected) solar zenith, degrees. */
  solarZenith: number;
  /** Extraterrestrial normal irradiance, W/m². */
  dniExtra: number;
  /** Floor on cos(zenith) in the horizontal extraterrestrial term. Default 0.065 (≈ 86.27°). */
  minCosZenith?: number;
  /** Upper clip on the result. Default 2. */
  maxClearnessIndex?: number;
}

/**
 * Clearness index `kt = GHI / (I0 · max(cos z, minCosZenith))`, clipped to
 * `[0, maxClearnessIndex]` (pvlib `irradiance.clearness_index`).
 *
 * @example
 * clearnessIndex({ ghi: 800, solarZenith: 30, dniExtra: 1366.1 }); // ≈ 0.676
 */
export const clearnessIndex = (input: ClearnessIndexInput): number => {
  const { ghi, solarZenith, dniExtra, minCosZenith = 0.065, maxClearnessIndex = 2 } = input;
  const i0h = dniExtra * Math.max(Math.cos(solarZenith * D2R), minCosZenith);
  return Math.min(Math.max(ghi / i0h, 0), maxClearnessIndex);
};

/**
 * Spencer (1971) extraterrestrial normal irradiance for the UTC day of year of `timeMs` —
 * pvlib `irradiance.get_extra_radiation(method="spencer")`. Module-internal (not exported
 * from the subpath entry); the irradiance module owns the public version.
 */
export const spencerDniExtra = (timeMs: number, solarConstant: number): number => {
  if (!Number.isFinite(timeMs)) throw new RangeError(`timeMs must be finite, got ${timeMs}`);
  const start = new Date(timeMs);
  start.setUTCMonth(0, 1);
  start.setUTCHours(0, 0, 0, 0);
  const doy = Math.floor((timeMs - start.getTime()) / MS_PER_DAY) + 1;
  const b = ((2 * Math.PI) / 365) * (doy - 1);
  return (
    solarConstant *
    (1.00011 +
      0.034221 * Math.cos(b) +
      0.00128 * Math.sin(b) +
      0.000719 * Math.cos(2 * b) +
      7.7e-5 * Math.sin(2 * b))
  );
};
