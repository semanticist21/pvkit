import { type Degrees, degrees } from "../../../units.ts";

/** Inputs for {@link calcCrossAxisTilt}. Degrees; azimuths from north, clockwise. */
export interface CalcCrossAxisTiltInput {
  /** Azimuth of the slope normal projected on the horizontal, degrees. */
  slopeAzimuth: number;
  /** Slope tilt from horizontal, degrees. */
  slopeTilt: number;
  /** Azimuth of the tracker axes projected on the horizontal, degrees. */
  axisAzimuth: number;
  /** Tracker axis tilt from horizontal, degrees (e.g. from `calcAxisTilt`). */
  axisTilt: number;
}

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

/**
 * Cross-axis tilt βc (Anderson & Mikofski 2020, eqs. 22–26): angle from horizontal of the
 * line where the slope meets a plane perpendicular to the axes. Right-handed: for axes
 * heading south, negative when the slope falls to the east, positive when to the west.
 * Feed it to `singleaxis({ crossAxisTilt })` for slope-aware backtracking.
 *
 * @example
 * calcCrossAxisTilt({ slopeAzimuth: 90, slopeTilt: 10, axisAzimuth: 180, axisTilt: 0 }); // -10
 */
export const calcCrossAxisTilt = ({
  slopeAzimuth,
  slopeTilt,
  axisAzimuth,
  axisTilt,
}: CalcCrossAxisTiltInput): Degrees => {
  const dg = (axisAzimuth - slopeAzimuth) * D2R;
  const ba = axisTilt * D2R;
  const bg = slopeTilt * D2R;
  const cosBa = Math.cos(ba);
  const sinBa = Math.sin(ba);
  const cosBg = Math.cos(bg);
  const sinBg = Math.sin(bg);
  const cosDg = Math.cos(dg);
  const sinDg = Math.sin(dg);
  // Eq. 22: tracker normal v = axis × slope normal.
  const vx = sinDg * cosBa * cosBg;
  const vy = sinBa * sinBg + cosDg * cosBa * cosBg;
  const vz = -sinDg * sinBg * cosBa;
  // Eq. 26.
  const norm = Math.sqrt(vx * vx + vy * vy + vz * vz);
  return degrees(Math.asin(((vx * cosDg - vy * sinDg) * sinBa + vz * cosBa) / norm) * R2D);
};
