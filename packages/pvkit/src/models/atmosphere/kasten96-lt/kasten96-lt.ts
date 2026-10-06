/** Inputs for {@link kasten96Lt}. */
export interface Kasten96LtInput {
  /** Pressure-adjusted air mass, unitless. */
  airmassAbsolute: number;
  /** Precipitable water, cm. */
  precipitableWater: number;
  /** Broadband aerosol optical depth, unitless (e.g. from `birdHulstrom80AodBb`). */
  aodBb: number;
}

/**
 * Linke turbidity factor (Kasten 1996, Molineaux et al. 1998 parametrization), unitless.
 *
 * @example
 * kasten96Lt({ airmassAbsolute: 1, precipitableWater: 1, aodBb: 0.1 }); // ≈ 3.564
 */
export const kasten96Lt = (input: Kasten96LtInput): number => {
  const { airmassAbsolute: m, precipitableWater, aodBb } = input;
  const deltaCda = -0.101 + 0.235 * m ** -0.16;
  const deltaW = 0.112 * m ** -0.55 * precipitableWater ** 0.34;
  // pvlib writes −(9.4 + 0.9m)·ln(exp(−m·δ))/m; ln∘exp cancels exactly. Its 0/0 at
  // m = 0 (and NaN for m < 0) is kept explicitly.
  if (!(m > 0)) return Number.NaN;
  return (9.4 + 0.9 * m) * (deltaCda + deltaW + aodBb);
};
