import { type Degrees, degrees, limitDegrees } from "../../../units.ts";

/** Inputs for {@link singleaxis}. Degrees; azimuths from north, clockwise. */
export interface SingleaxisInput {
  /** Apparent (refraction-corrected) solar zenith, degrees. */
  apparentZenith: number;
  /** Solar azimuth, degrees. */
  solarAzimuth: number;
  /** Axis tilt from horizontal, positive downward toward `axisAzimuth`, degrees. Default 0. */
  axisTilt?: number;
  /** Compass direction of the axis (positive y-axis), degrees. Default 0. */
  axisAzimuth?: number;
  /** Maximum rotation from the axis-horizontal position, degrees. Default 90. */
  maxAngle?: number;
  /** Minimum rotation, degrees. Default `-maxAngle` (pvlib scalar `max_angle`). */
  minAngle?: number;
  /** Backtrack to avoid row-to-row shading. Default true. */
  backtrack?: boolean;
  /** Ground coverage ratio (module width / row pitch), (0, 1]. Default 2/7. */
  gcr?: number;
  /** Cross-axis slope tilt (see `calcCrossAxisTilt`), degrees. Default 0. */
  crossAxisTilt?: number;
}

/** Tracker orientation. All `NaN` when the sun is below the horizon (apparentZenith > 90). */
export interface SingleaxisResult {
  /** Rotation about the axis, right-handed; 0 = horizontal, positive toward west for a south axis. */
  trackerTheta: Degrees;
  /** Angle of incidence of beam irradiance on the rotated surface. */
  aoi: Degrees;
  /** Surface tilt from horizontal. */
  surfaceTilt: Degrees;
  /** Surface azimuth, [0, 360); `axisAzimuth − 90` when the surface is flat. */
  surfaceAzimuth: Degrees;
}

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const NAN = degrees(Number.NaN);

/**
 * True-tracking rotation: sun vector projected onto the plane normal to the axis
 * (Anderson & Mikofski 2020, eqs. 4–5; pvlib `shading.projected_solar_zenith_angle`).
 */
const trueTrackingAngle = (zenith: number, azimuth: number, axisTilt: number, axisAz: number) => {
  const sinZ = Math.sin(zenith * D2R);
  const sx = sinZ * Math.sin(azimuth * D2R);
  const sy = sinZ * Math.cos(azimuth * D2R);
  const sz = Math.cos(zenith * D2R);
  const cosAa = Math.cos(axisAz * D2R);
  const sinAa = Math.sin(axisAz * D2R);
  const sinAt = Math.sin(axisTilt * D2R);
  const sxP = sx * cosAa - sy * sinAa;
  const szP = sx * sinAa * sinAt + sy * sinAt * cosAa + sz * Math.cos(axisTilt * D2R);
  return Math.atan2(sxP, szP) * R2D;
};

/**
 * Single-axis tracker rotation with optional slope-aware backtracking (Anderson &
 * Mikofski 2020; Lorenzo et al. 2011), then the resulting surface orientation (Marion &
 * Dobos 2013) and angle of incidence. One instant per call.
 *
 * @example
 * singleaxis({ apparentZenith: 60, solarAzimuth: 120, axisAzimuth: 180, maxAngle: 60 });
 */
export const singleaxis = (input: SingleaxisInput): SingleaxisResult => {
  const {
    apparentZenith,
    solarAzimuth,
    axisTilt = 0,
    axisAzimuth = 0,
    maxAngle = 90,
    minAngle = -maxAngle,
    backtrack = true,
    gcr = 2 / 7,
    crossAxisTilt = 0,
  } = input;
  if (!(minAngle <= maxAngle)) {
    throw new RangeError(`minAngle ${minAngle} must not exceed maxAngle ${maxAngle}`);
  }
  if (backtrack && !(gcr > 0 && gcr <= 1)) throw new RangeError(`gcr out of (0, 1]: ${gcr}`);
  // Sun below the horizon: pvlib masks every output to NaN.
  if (apparentZenith > 90) {
    return { trackerTheta: NAN, aoi: NAN, surfaceTilt: NAN, surfaceAzimuth: NAN };
  }

  const omegaIdeal = trueTrackingAngle(apparentZenith, solarAzimuth, axisTilt, axisAzimuth);
  let theta = omegaIdeal;
  if (backtrack) {
    // Eqs. 14–16: correct only while rows would shade each other (|·| < 1); the abs
    // handles rare sun positions below the array plane (pvlib GH 824).
    const axesDistance = 1 / (gcr * Math.cos(crossAxisTilt * D2R));
    const temp = Math.abs(axesDistance * Math.cos((omegaIdeal - crossAxisTilt) * D2R));
    if (temp < 1) theta += -Math.sign(omegaIdeal) * Math.acos(temp) * R2D;
  }
  theta = Math.min(Math.max(theta, minAngle), maxAngle);

  // Surface orientation (Marion & Dobos eq. 1; azimuth from the rotated unit normal
  // R = Rz(−axisAzimuth)·Rx(−axisTilt)·Ry(theta) applied to ẑ, as pvlib).
  const cosTh = Math.cos(theta * D2R);
  const sinTh = Math.sin(theta * D2R);
  const cosA = Math.cos(-axisAzimuth * D2R);
  const sinA = Math.sin(-axisAzimuth * D2R);
  const sinT = Math.sin(-axisTilt * D2R);
  const cosTilt = cosTh * Math.cos(axisTilt * D2R);
  const surfaceTilt = Math.acos(cosTilt) * R2D;
  // Flat surface (cos product rounds to exactly 1, the only way acos gives 0): the
  // normal's azimuth is undefined; pvlib pins it to axisAzimuth − 90.
  const rawAzimuth =
    cosTilt >= 1
      ? axisAzimuth - 90
      : Math.atan2(sinA * sinT * cosTh + cosA * sinTh, sinA * sinTh - cosA * sinT * cosTh) * R2D;
  const surfaceAzimuth = limitDegrees(rawAzimuth);

  // irradiance.aoi with the projection clipped to [−1, 1] (pvlib GH 1185).
  const projection =
    Math.cos(surfaceTilt * D2R) * Math.cos(apparentZenith * D2R) +
    Math.sin(surfaceTilt * D2R) *
      Math.sin(apparentZenith * D2R) *
      Math.cos((solarAzimuth - surfaceAzimuth) * D2R);
  const aoi = Math.acos(Math.min(Math.max(projection, -1), 1)) * R2D;

  return {
    trackerTheta: degrees(theta),
    aoi: degrees(aoi),
    surfaceTilt: degrees(surfaceTilt),
    surfaceAzimuth,
  };
};
