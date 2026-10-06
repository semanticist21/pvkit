/**
 * Site pressure from altitude, standard atmosphere (101325 Pa, 288.15 K at sea level,
 * lapse rate −6.5 K/km, dry air). Pa; `NaN` above ~44.3 km where the base goes negative.
 *
 * @example
 * alt2pres({ altitude: 1830 }); // ≈ 81 188 Pa
 */
export const alt2pres = (input: {
  /** Altitude above sea level, metres. */
  altitude: number;
}): number => 100 * ((44_331.514 - input.altitude) / 11_880.516) ** (1 / 0.1902632);

/**
 * Altitude from site pressure, inverse of {@link alt2pres} (same standard atmosphere,
 * pvlib's rounded coefficients). Metres; `NaN` for negative pressure.
 *
 * @example
 * pres2alt({ pressure: 82_000 }); // ≈ 1 750 m
 */
export const pres2alt = (input: {
  /** Atmospheric pressure, Pa. */
  pressure: number;
}): number => 44_331.5 - 4946.62 * input.pressure ** 0.190263;
