import { projectedSolarZenithAngle } from "../projected-solar-zenith-angle/index.ts";

const D2R = Math.PI / 180;

export interface ShadedFraction1dInput {
  /**
   * Degrees. Apparent (refraction-corrected) or true; apparent is the direction the beam
   * actually arrives from, so prefer it near the horizon.
   */
  solarZenith: number;
  /** Degrees from north, clockwise. */
  solarAzimuth: number;
  /**
   * Row axis azimuth, degrees. A fixed-tilt row facing azimuth γ is a tracker with
   * `axisAzimuth = γ − 90` and `shadedRowRotation = tilt`.
   */
  axisAzimuth: number;
  /** Right-handed rotation about the axis of the row receiving shade, degrees. */
  shadedRowRotation: number;
  /** Row slant length (any length unit, same as `pitch`). */
  collectorWidth: number;
  /** Axis-to-axis horizontal row spacing. */
  pitch: number;
  /** Default 0. */
  axisTilt?: number;
  /** Axis-to-surface distance (torque tube offset), same unit as `pitch`. Default 0. */
  surfaceToAxisOffset?: number;
  /**
   * Slope of the plane of the axes, right-handed about them, degrees (as `@pvkit/core`
   * tracking's `crossAxisTilt`). Default 0.
   */
  crossAxisTilt?: number;
  /** Rotation of the row casting the shade. Default `shadedRowRotation`. */
  shadingRowRotation?: number;
}

/**
 * Fraction 0–1 of a row's slant shaded by the next row (Anderson & Jensen 2024, eq. 32).
 * The shaded/shading roles must not swap during the period — for N–S trackers pick them
 * by the sign of the projected solar zenith (see pvlib's example).
 */
export const shadedFraction1d = (input: ShadedFraction1dInput): number => {
  const { solarZenith, solarAzimuth, axisAzimuth, shadedRowRotation } = input;
  const { collectorWidth, pitch, axisTilt = 0, surfaceToAxisOffset = 0 } = input;
  const { crossAxisTilt = 0, shadingRowRotation = shadedRowRotation } = input;
  const thetaS = projectedSolarZenithAngle({ solarZenith, solarAzimuth, axisTilt, axisAzimuth });
  const d1 = (shadingRowRotation - thetaS) * D2R;
  const d2 = (shadedRowRotation - thetaS) * D2R;
  const cos2 = Math.abs(Math.cos(d2));
  const t =
    0.5 +
    Math.abs(Math.cos(d1)) / cos2 / 2 +
    ((Math.sign(thetaS) * surfaceToAxisOffset) / collectorWidth / cos2) *
      (Math.sin(d2) - Math.sin(d1)) -
    ((pitch / collectorWidth) * Math.cos((thetaS - crossAxisTilt) * D2R)) /
      cos2 /
      Math.cos(crossAxisTilt * D2R);
  return Math.min(1, Math.max(0, t));
};
