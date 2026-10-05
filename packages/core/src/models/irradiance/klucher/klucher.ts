import { aoiProjection } from "../aoi/aoi.ts";

/** Inputs for {@link klucher}. Angles in degrees, irradiance W/m². */
export interface KlucherInput {
  /** Panel tilt from horizontal, degrees, [0, 180]. */
  surfaceTilt: number;
  /** Panel azimuth, degrees from north, clockwise. */
  surfaceAzimuth: number;
  /** Diffuse horizontal irradiance, W/m². */
  dhi: number;
  /** Global horizontal irradiance, W/m². */
  ghi: number;
  /** Solar zenith, degrees. */
  solarZenith: number;
  /** Solar azimuth, degrees. */
  solarAzimuth: number;
}

const D2R = Math.PI / 180;

/**
 * Klucher (1979) anisotropic sky diffuse on a tilted plane, W/m²:
 * `dhi · ½(1 + cos β) · (1 + F sin³(β/2)) · (1 + F cos²θ sin³z)`, `F = 1 − (dhi/ghi)²`.
 * `F = 0` when `dhi/ghi` is NaN (dhi = ghi = 0), as in pvlib.
 */
export const klucher = (input: KlucherInput): number => {
  const { surfaceTilt, dhi, ghi, solarZenith } = input;
  const cosTt = Math.max(aoiProjection(input), 0);
  let f = 1 - (dhi / ghi) ** 2;
  if (Number.isNaN(f)) f = 0;
  const term1 = 0.5 * (1 + Math.cos(surfaceTilt * D2R));
  const term2 = 1 + f * Math.sin(0.5 * surfaceTilt * D2R) ** 3;
  const term3 = 1 + f * cosTt ** 2 * Math.sin(solarZenith * D2R) ** 3;
  return dhi * term1 * term2 * term3;
};
