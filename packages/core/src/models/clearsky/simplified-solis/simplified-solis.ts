import { degrees, toRadians } from "../../../units.ts";
import type { ClearSkyIrradiance } from "../ineichen/ineichen.ts";

/** Inputs for {@link simplifiedSolis}. */
export interface SimplifiedSolisInput {
  /** Refraction-corrected solar elevation angle, degrees. */
  apparentElevation: number;
  /** Aerosol optical depth at 700 nm, unitless, ≥ 0 (model fitted on 0–0.45). Default 0.1. */
  aod700?: number;
  /** Precipitable water, **cm** (fitted on 0.2–10; values < 0.2 are clamped to 0.2). Default 1. */
  precipitableWater?: number;
  /** Atmospheric pressure, Pa, > 0 (fitted on 41 000–101 325). Default 101325. */
  pressure?: number;
  /** Extraterrestrial normal irradiance, W/m² (sets the output unit). Default 1364. */
  dniExtra?: number;
}

const P0 = 101_325;

/**
 * Simplified Solis clear-sky model (Ineichen 2008): `I = I0′·exp(−τ / sin^k h)` with
 * τ, k fitted to aerosol optical depth, precipitable water and pressure.
 *
 * @example
 * simplifiedSolis({ apparentElevation: 60, aod700: 0.1, precipitableWater: 1 });
 */
export const simplifiedSolis = (input: SimplifiedSolisInput): ClearSkyIrradiance => {
  const {
    apparentElevation,
    aod700: a = 0.1,
    precipitableWater = 1,
    pressure = P0,
    dniExtra = 1364,
  } = input;
  if (a < 0) throw new RangeError(`aod700 must be ≥ 0, got ${a}`);
  if (pressure <= 0) throw new RangeError(`pressure must be > 0 Pa, got ${pressure}`);

  const w = Math.max(precipitableWater, 0.2);
  const lw = Math.log(w);
  const lp = Math.log(pressure / P0);
  const a2 = a * a;

  // Enhanced extraterrestrial irradiance I0′ (eq. 2).
  const i0p =
    dniExtra * (0.12 * w ** 0.56 * a2 + 0.97 * w ** 0.032 * a + 1.08 * w ** 0.0051 + 0.071 * lp);
  // Beam (eqs. 3–4).
  const taub =
    (1.82 + 0.056 * lw + 0.0071 * lw * lw) * a +
    (0.33 + 0.045 * lw + 0.0096 * lw * lw) +
    (0.0089 * w + 0.13) * lp;
  const b = (0.00925 * a2 + 0.0148 * a - 0.0172) * lw + (-0.7565 * a2 + 0.5057 * a + 0.4557);
  // Global (eqs. 5–6).
  const taug =
    (1.24 + 0.047 * lw + 0.0061 * lw * lw) * a +
    (0.27 + 0.043 * lw + 0.009 * lw * lw) +
    (0.0079 * w + 0.1) * lp;
  const g = -0.0147 * lw - 0.3079 * a2 + 0.2846 * a + 0.3798;
  // Diffuse (eqs. 7–8): coefficient set switches at aod700 = 0.05.
  const low = a < 0.05;
  const td4 = low ? 86 * w - 13800 : -0.21 * w + 11.6;
  const td3 = low ? -3.11 * w + 79.4 : 0.27 * w - 20.7;
  const td2 = low ? -0.23 * w + 74.8 : -0.134 * w + 15.5;
  const td1 = low ? 0.092 * w - 8.86 : 0.0554 * w - 5.71;
  const td0 = low ? 0.0042 * w + 3.12 : 0.0057 * w + 2.94;
  const tdp = low ? -0.83 * (1 + a) ** -17.2 : -0.71 * (1 + a) ** -15;
  const taud = td4 * a2 * a2 + td3 * a2 * a + td2 * a2 + td1 * a + td0 + tdp * lp;
  const d = -0.337 * a2 + 0.63 * a + 0.116 + lp / (18 + 152 * a);

  // Floor at 1e-30 so night yields 0, not NaN (pvlib behaviour).
  const sinH = Math.max(1e-30, Math.sin(toRadians(degrees(apparentElevation))));
  return {
    ghi: i0p * Math.exp(-taug / sinH ** g) * sinH,
    dni: i0p * Math.exp(-taub / sinH ** b),
    dhi: i0p * Math.exp(-taud / sinH ** d),
  };
};
