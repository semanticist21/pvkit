/**
 * Loss categories for {@link pvwattsLosses}, each a fraction (0–1, unitless). Defaults are
 * pvlib's percent defaults / 100.
 */
export interface PvwattsLossesInput {
  /** Default 0.02. */
  soiling?: number;
  /** Default 0.03. */
  shading?: number;
  /** Default 0. */
  snow?: number;
  /** Default 0.02. */
  mismatch?: number;
  /** Default 0.02. */
  wiring?: number;
  /** Default 0.005. */
  connections?: number;
  /** Light-induced degradation. Default 0.015. */
  lid?: number;
  /** Default 0.01. */
  nameplateRating?: number;
  /** Default 0. */
  age?: number;
  /** Default 0.03. */
  availabilityLoss?: number;
}

/**
 * PVWatts system losses (Dobos 2014): `L = 1 − Π(1 − Lᵢ)`, fraction (pvlib returns percent).
 * All defaults → ≈ 0.1408.
 *
 * @example
 * pvwattsLosses(); // 0.14075660688264469
 */
export const pvwattsLosses = (input: PvwattsLossesInput = {}): number => {
  const {
    soiling = 0.02,
    shading = 0.03,
    snow = 0,
    mismatch = 0.02,
    wiring = 0.02,
    connections = 0.005,
    lid = 0.015,
    nameplateRating = 0.01,
    age = 0,
    availabilityLoss = 0.03,
  } = input;
  let perf = 1;
  for (const l of [
    soiling,
    shading,
    snow,
    mismatch,
    wiring,
    connections,
    lid,
    nameplateRating,
    age,
    availabilityLoss,
  ]) {
    perf *= 1 - l;
  }
  return 1 - perf;
};
