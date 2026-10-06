import { type Degrees, degrees } from "../../../units.ts";

/** Inputs for {@link calcAxisTilt}. Degrees; azimuths from north, clockwise. */
export interface CalcAxisTiltInput {
  /** Azimuth of the slope normal projected on the horizontal, degrees. */
  slopeAzimuth: number;
  /** Slope tilt from horizontal (tilt of its normal from vertical), degrees. */
  slopeTilt: number;
  /** Azimuth of the tracker axes projected on the horizontal, degrees. */
  axisAzimuth: number;
}

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

/**
 * Tilt of a tracker axis lying in a sloped plane (Anderson & Mikofski 2020, eqs. 18–19):
 * `tan βa = cos(γa − γg)·tan βg`.
 *
 * @example
 * calcAxisTilt({ slopeAzimuth: 180, slopeTilt: 10, axisAzimuth: 180 }); // 10
 */
export const calcAxisTilt = ({
  slopeAzimuth,
  slopeTilt,
  axisAzimuth,
}: CalcAxisTiltInput): Degrees =>
  degrees(
    Math.atan(Math.cos((axisAzimuth - slopeAzimuth) * D2R) * Math.tan(slopeTilt * D2R)) * R2D,
  );
