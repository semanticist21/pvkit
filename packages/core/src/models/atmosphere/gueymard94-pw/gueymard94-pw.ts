/** Inputs for {@link gueymard94Pw}. */
export interface Gueymard94PwInput {
  /** Ambient air temperature at the surface, °C. */
  temperature: number;
  /** Relative humidity at the surface, % (0–100). */
  relativeHumidity: number;
}

/**
 * Precipitable water from surface temperature and relative humidity (Gueymard 1994),
 * cm. Floored at 0.1 cm, as pvlib.
 *
 * @example
 * gueymard94Pw({ temperature: 20, relativeHumidity: 50 }); // ≈ 1.87 cm
 */
export const gueymard94Pw = (input: Gueymard94PwInput): number => {
  const { temperature, relativeHumidity } = input;
  const t = temperature + 273.15;
  const theta = t / 273.15;
  const x = 100 / t;
  const pw =
    0.1 *
    (0.4976 + 1.5265 * theta + Math.exp(13.6897 * theta - 14.9188 * theta ** 3)) *
    (((216.7 * relativeHumidity) / (100 * t)) *
      Math.exp(22.33 - 49.14 * x - 10.922 * x ** 2 - 0.39015 * (t / 100)));
  return Math.max(pw, 0.1);
};
