import { projectedSolarZenithAngle } from "../projected-solar-zenith-angle/index.ts";

const D2R = Math.PI / 180;

export interface MinPitchInput {
  /** Row slant length (any length unit; the result is in the same unit). */
  collectorWidth: number;
  /** Degrees from horizontal. */
  surfaceTilt: number;
  /** Direction the rows face, degrees from north, clockwise. */
  surfaceAzimuth: number;
  /**
   * Design sun (e.g. winter-solstice 9:00 or noon), degrees. Apparent (refraction-corrected)
   * or true zenith; apparent is the direction the beam actually arrives from.
   */
  solarZenith: number;
  solarAzimuth: number;
}

/**
 * Smallest horizontal row pitch with no row-to-row beam shade on the front face at the
 * design sun, for fixed rows on flat ground: `W·cos(β − θT) / cos θT`, θT the projected
 * solar zenith — the root of {@link import("../shaded-fraction1d/index.ts").shadedFraction1d}
 * (Anderson & Jensen 2024, eq. 32) with zero offset and slope. With the sun behind the rows
 * in their cross-section (θT ≤ 0) no neighbour can shade the front face, so the result is the
 * row footprint `W·cos β` (rows just touch). `Infinity` when the sun is at or below the
 * horizon in the row's cross-section. GCR = `collectorWidth / pitch`.
 *
 * @example minPitch({ collectorWidth: 2, surfaceTilt: 30, surfaceAzimuth: 180, solarZenith: 60, solarAzimuth: 180 }); // ≈ 3.46
 */
export const minPitch = ({
  collectorWidth,
  surfaceTilt,
  surfaceAzimuth,
  solarZenith,
  solarAzimuth,
}: MinPitchInput): number => {
  const thetaT = projectedSolarZenithAngle({
    solarZenith,
    solarAzimuth,
    axisTilt: 0,
    axisAzimuth: surfaceAzimuth - 90,
  });
  const cosT = Math.cos(thetaT * D2R);
  if (!(cosT > 1e-12)) return Number.POSITIVE_INFINITY;
  // θT ≤ 0: shade could only reach the rear face; clamp to the footprint (continuous at 0).
  const t = Math.max(thetaT, 0) * D2R;
  return (collectorWidth * Math.cos(surfaceTilt * D2R - t)) / Math.cos(t);
};
