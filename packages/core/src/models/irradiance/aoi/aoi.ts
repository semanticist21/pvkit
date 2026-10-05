import { type Degrees, degrees } from "../../../units.ts";

/** Surface and sun geometry, degrees. Azimuth from north, clockwise. */
export interface AoiInput {
  /** Panel tilt from horizontal, degrees, [0, 180]. */
  surfaceTilt: number;
  /** Panel azimuth, degrees (N=0, E=90, S=180, W=270). */
  surfaceAzimuth: number;
  /** Solar zenith, degrees. Use apparent zenith if refraction matters. */
  solarZenith: number;
  /** Solar azimuth, degrees. */
  solarAzimuth: number;
}

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

/**
 * Cosine of the angle of incidence of the sun's beam on the panel surface,
 * clipped to [-1, 1]. Negative when the sun is behind the panel.
 */
export const aoiProjection = (input: AoiInput): number => {
  const { surfaceTilt, surfaceAzimuth, solarZenith, solarAzimuth } = input;
  const tilt = surfaceTilt * D2R;
  const zen = solarZenith * D2R;
  const p =
    Math.cos(tilt) * Math.cos(zen) +
    Math.sin(tilt) * Math.sin(zen) * Math.cos((solarAzimuth - surfaceAzimuth) * D2R);
  return Math.min(Math.max(p, -1), 1);
};

/**
 * Angle of incidence of the sun's beam on the panel surface, degrees, [0, 180].
 * Exceeds 90° when the sun is behind the panel.
 *
 * @example
 * aoi({ surfaceTilt: 30, surfaceAzimuth: 180, solarZenith: 40, solarAzimuth: 160 });
 */
export const aoi = (input: AoiInput): Degrees => degrees(Math.acos(aoiProjection(input)) * R2D);
