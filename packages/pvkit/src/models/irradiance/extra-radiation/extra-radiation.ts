import { R_TERMS } from "./earth-radius-terms.ts";

/** Earth–sun distance model for {@link extraRadiation}. */
export type ExtraRadiationMethod = "spencer" | "asce" | "nrel";

/** Inputs for {@link extraRadiation}. */
export interface ExtraRadiationInput {
  /** Instant as UTC epoch milliseconds. spencer/asce use only its UTC day of year. */
  timeMs: number;
  /** Solar constant, W/m². Default 1366.1. */
  solarConstant?: number;
  /** Distance model. Default "spencer". */
  method?: ExtraRadiationMethod;
  /** ΔT = TT − UT, seconds; "nrel" only. Default 67. */
  deltaT?: number;
}

const MS_PER_DAY = 86_400_000;

/** UTC day of year, 1..366. */
const dayOfYear = (timeMs: number) => {
  const year = new Date(timeMs).getUTCFullYear();
  return Math.floor((timeMs - Date.UTC(year, 0, 1)) / MS_PER_DAY) + 1;
};

/** SPA Earth radius vector R (AU), Reda & Andreas eq. 11 with Table A4.2 R terms. */
const earthSunDistance = (timeMs: number, deltaT: number) => {
  const jde = timeMs / MS_PER_DAY + 2_440_587.5 + deltaT / 86_400;
  const jme = (jde - 2_451_545) / 36_525 / 10;
  let r = 0;
  let pow = 1;
  for (const group of R_TERMS) {
    let s = 0;
    for (const [a, b, c] of group) s += a * Math.cos(b + c * jme);
    r += s * pow;
    pow *= jme;
  }
  return r / 1e8;
};

/**
 * Extraterrestrial normal irradiance `E0 = Esc · (R0/R)²`, W/m².
 *
 * - `spencer` (default): Spencer (1971) Fourier series in day angle `B = 2π(doy − 1)/365`.
 * - `asce`: `1 + 0.033·cos(2π·doy/365)`.
 * - `nrel`: `(R0/R)² = R⁻²` with R from the NREL SPA radius vector at the exact instant.
 *
 * @example
 * extraRadiation({ timeMs: Date.UTC(2025, 0, 3) }); // ≈ 1413 W/m² near perihelion
 */
export const extraRadiation = (input: ExtraRadiationInput): number => {
  const { timeMs, solarConstant = 1366.1, method = "spencer", deltaT = 67 } = input;
  if (!Number.isFinite(timeMs)) throw new RangeError(`timeMs must be finite, got ${timeMs}`);
  let ratio: number;
  if (method === "spencer") {
    const b = ((2 * Math.PI) / 365) * (dayOfYear(timeMs) - 1);
    ratio =
      1.00011 +
      0.034221 * Math.cos(b) +
      0.00128 * Math.sin(b) +
      0.000719 * Math.cos(2 * b) +
      0.000077 * Math.sin(2 * b);
  } else if (method === "asce") {
    ratio = 1 + 0.033 * Math.cos(((2 * Math.PI) / 365) * dayOfYear(timeMs));
  } else if (method === "nrel") {
    ratio = earthSunDistance(timeMs, deltaT) ** -2;
  } else {
    throw new RangeError(`unknown extraRadiation method: ${String(method)}`);
  }
  return solarConstant * ratio;
};
