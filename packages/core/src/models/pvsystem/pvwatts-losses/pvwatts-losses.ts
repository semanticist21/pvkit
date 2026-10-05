/** Loss categories for {@link pvwattsLosses}, each in percent. Defaults are pvlib's. */
export interface PvwattsLossesInput {
  /** Default 2. */
  soiling?: number;
  /** Default 3. */
  shading?: number;
  /** Default 0. */
  snow?: number;
  /** Default 2. */
  mismatch?: number;
  /** Default 2. */
  wiring?: number;
  /** Default 0.5. */
  connections?: number;
  /** Light-induced degradation. Default 1.5. */
  lid?: number;
  /** Default 1. */
  nameplateRating?: number;
  /** Default 0. */
  age?: number;
  /** Default 3. */
  availability?: number;
}

/**
 * PVWatts system losses (Dobos 2014): `L = 100·(1 − Π(1 − Lᵢ/100))`, percent.
 * All defaults → ≈ 14.08 %.
 *
 * @example
 * pvwattsLosses({}); // 14.075660688264469
 */
export const pvwattsLosses = (input: PvwattsLossesInput = {}): number => {
  const {
    soiling = 2,
    shading = 3,
    snow = 0,
    mismatch = 2,
    wiring = 2,
    connections = 0.5,
    lid = 1.5,
    nameplateRating = 1,
    age = 0,
    availability = 3,
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
    availability,
  ]) {
    perf *= 1 - l / 100;
  }
  return (1 - perf) * 100;
};
