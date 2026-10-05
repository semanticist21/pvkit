import { aoiProjection } from "../aoi/aoi.ts";

/** Inputs for {@link reindl}. Angles in degrees, irradiance W/m². */
export interface ReindlInput {
  /** Panel tilt from horizontal, degrees, [0, 180]. */
  surfaceTilt: number;
  /** Panel azimuth, degrees from north, clockwise. */
  surfaceAzimuth: number;
  /** Diffuse horizontal irradiance, W/m². */
  dhi: number;
  /** Direct normal irradiance, W/m². */
  dni: number;
  /** Global horizontal irradiance, W/m². */
  ghi: number;
  /** Extraterrestrial normal irradiance, W/m². */
  dniExtra: number;
  /** Solar zenith, degrees. */
  solarZenith: number;
  /** Solar azimuth, degrees. */
  solarAzimuth: number;
}

const D2R = Math.PI / 180;

/**
 * Reindl, Beckman & Duffie (1990) sky diffuse on a tilted plane, W/m²:
 * `dhi · [(1 − AI)·SVF·(1 + √(Hb/ghi)·sin³(β/2)) + AI·Rb]`, with `AI = dni/dniExtra`,
 * `SVF = (1 + cos β)/2`, `Hb = max(dni cos z, 0)`, `Rb = max(cos θ, 0)/max(cos z, 0.01745)`.
 * `Hb/ghi` is taken as 0 when `ghi = 0`, as in pvlib.
 */
export const reindl = (input: ReindlInput): number => {
  const { surfaceTilt, dhi, dni, ghi, dniExtra, solarZenith } = input;
  const cosTt = Math.max(aoiProjection(input), 0);
  const cosZ = Math.cos(solarZenith * D2R);
  const rb = cosTt / Math.max(cosZ, 0.01745);
  const ai = dni / dniExtra;
  const hb = Math.max(dni * cosZ, 0);
  const svf = (1 + Math.cos(surfaceTilt * D2R)) / 2;
  const hbToGhi = ghi === 0 ? 0 : hb / ghi;
  const h = Math.sqrt(hbToGhi) * Math.sin((surfaceTilt / 2) * D2R) ** 3;
  const term1 = (1 - ai) * svf;
  return dhi * (term1 + ai * rb + term1 * h);
};
