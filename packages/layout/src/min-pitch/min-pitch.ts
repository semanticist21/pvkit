import { projectedSolarZenithAngle } from "../projected-solar-zenith-angle/index.ts";

const D2R = Math.PI / 180;

export interface MinPitchInput {
  /** Row slant length (any length unit; the result is in the same unit). */
  collectorWidth: number;
  /** Degrees from horizontal. */
  surfaceTilt: number;
  /** Direction the rows face, degrees from north, clockwise. */
  surfaceAzimuth: number;
  /** Design sun (e.g. winter-solstice 9:00 or noon), degrees. */
  solarZenith: number;
  solarAzimuth: number;
}

/**
 * Smallest horizontal row pitch with no row-to-row beam shade at the design sun, for fixed
 * rows on flat ground: `W·|cos(β − θT)| / cos θT`, θT the projected solar zenith — the root
 * of {@link import("../shaded-fraction1d/index.ts").shadedFraction1d} (Anderson & Jensen
 * 2024, eq. 32) with zero offset and slope. `Infinity` when the sun is at or below the
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
  return (collectorWidth * Math.abs(Math.cos((surfaceTilt - thetaT) * D2R))) / cosT;
};
