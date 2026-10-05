import { aoiProjection } from "../aoi/aoi.ts";
import { PEREZ_COEFFICIENTS, type PerezModel } from "./perez-coefficients.ts";

export type { PerezModel } from "./perez-coefficients.ts";

/** Inputs for {@link perez}. Angles in degrees, irradiance W/m². */
export interface PerezInput {
  /** Panel tilt from horizontal, degrees, [0, 180]. */
  surfaceTilt: number;
  /** Panel azimuth, degrees from north, clockwise. */
  surfaceAzimuth: number;
  /** Diffuse horizontal irradiance, W/m². */
  dhi: number;
  /** Direct normal irradiance, W/m². */
  dni: number;
  /** Extraterrestrial normal irradiance, W/m². */
  dniExtra: number;
  /** Solar zenith, degrees. */
  solarZenith: number;
  /** Solar azimuth, degrees. */
  solarAzimuth: number;
  /** Relative (not pressure-corrected) air mass. NaN (sun below horizon) → result 0. */
  airmassRelative: number;
  /** Coefficient set. Default "allsitescomposite1990". */
  model?: PerezModel;
}

const D2R = Math.PI / 180;
const KAPPA = 1.041;
/** Upper edges of sky-clearness bins 1..7 (bin 8 is ε ≥ 6.2). */
const EPS_BINS = [1.065, 1.23, 1.5, 1.95, 2.8, 4.5, 6.2];
const COS_85 = Math.cos(85 * D2R);

/**
 * Perez et al. (1990) anisotropic sky diffuse on a tilted plane, W/m²:
 * `max(dhi·[(1 − F1)(1 + cos β)/2 + F1·a/b + F2·sin β], 0)`, `a = max(cos θ, 0)`,
 * `b = max(cos z, cos 85°)`. F1 = max(f11 + f12Δ + f13z, 0), F2 = f21 + f22Δ + f23z with
 * coefficients chosen by the sky-clearness bin of
 * `ε = ((dhi + dni)/dhi + κz³)/(1 + κz³)` (z in radians, κ = 1.041), brightness
 * `Δ = dhi·airmass/dniExtra`. ε < 0 or NaN (dhi = dni = 0) → NaN, as in pvlib.
 */
export const perez = (input: PerezInput): number => {
  const {
    surfaceTilt,
    dhi,
    dni,
    dniExtra,
    solarZenith,
    airmassRelative,
    model = "allsitescomposite1990",
  } = input;
  if (!Object.hasOwn(PEREZ_COEFFICIENTS, model)) {
    throw new RangeError(`unknown Perez model: ${String(model)}`);
  }
  const coeffs = PEREZ_COEFFICIENTS[model];
  if (Number.isNaN(airmassRelative)) return 0;

  const z = solarZenith * D2R;
  const delta = (dhi * airmassRelative) / dniExtra;
  const kz3 = KAPPA * z ** 3;
  const eps = ((dhi + dni) / dhi + kz3) / (1 + kz3);
  // np.digitize: bin = number of edges ≤ ε (edges 0, 1.065, …, 6.2), minus 1.
  const row = eps >= 0 ? coeffs[EPS_BINS.filter((e) => e <= eps).length] : undefined;
  if (!row) return Number.NaN;
  const [f11, f12, f13, f21, f22, f23] = row;
  const f1 = Math.max(f11 + f12 * delta + f13 * z, 0);
  const f2 = f21 + f22 * delta + f23 * z;

  const a = Math.max(aoiProjection(input), 0);
  const b = Math.max(Math.cos(solarZenith * D2R), COS_85);
  const term1 = 0.5 * (1 - f1) * (1 + Math.cos(surfaceTilt * D2R));
  const term2 = (f1 * a) / b;
  const term3 = f2 * Math.sin(surfaceTilt * D2R);
  return Math.max(dhi * (term1 + term2 + term3), 0);
};
