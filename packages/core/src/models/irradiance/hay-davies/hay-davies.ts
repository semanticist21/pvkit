import { aoiProjection } from "../aoi/aoi.ts";

/** Inputs for {@link hayDavies}. Angles in degrees, irradiance W/m². */
export interface HayDaviesInput {
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
}

const D2R = Math.PI / 180;

/**
 * Hay & Davies (1980) sky diffuse on a tilted plane, W/m²: isotropic part
 * `max(dhi(1 − AI)·½(1 + cos β), 0)` plus circumsolar part `max(dhi·AI·Rb, 0)`, with
 * anisotropy index `AI = dni/dniExtra` and `Rb = max(cos θ, 0) / max(cos z, 0.01745)`.
 */
export const hayDavies = (input: HayDaviesInput): number => {
  const { surfaceTilt, dhi, dni, dniExtra, solarZenith } = input;
  const cosTt = Math.max(aoiProjection(input), 0);
  const rb = cosTt / Math.max(Math.cos(solarZenith * D2R), 0.01745);
  const ai = dni / dniExtra;
  const poaIsotropic = Math.max(dhi * (1 - ai) * (0.5 * (1 + Math.cos(surfaceTilt * D2R))), 0);
  const poaCircumsolar = Math.max(dhi * (ai * rb), 0);
  return poaIsotropic + poaCircumsolar;
};
