/** Inputs for {@link absoluteAirmass}. */
export interface AbsoluteAirmassInput {
  /** Relative air mass at sea level, unitless (e.g. from `relativeAirmass`). */
  airmassRelative: number;
  /** Site atmospheric pressure, Pa. Default 101325. */
  pressure?: number;
}

/**
 * Absolute (pressure-adjusted) air mass `AMa = AMr · P / 101325`. Unitless.
 *
 * @example
 * absoluteAirmass({ airmassRelative: 2, pressure: 82_000 }); // ≈ 1.6186
 */
export const absoluteAirmass = (input: AbsoluteAirmassInput): number => {
  const { airmassRelative, pressure = 101_325 } = input;
  return (airmassRelative * pressure) / 101_325;
};
