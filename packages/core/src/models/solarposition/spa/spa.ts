import { type Degrees, degrees, limitDegrees } from "../../../units.ts";
import { geocentric } from "./spa-geocentric.ts";

/** Inputs for {@link spa}. Angles in degrees; unit fixed by field name. */
export interface SpaInput {
  /** Instant as UTC epoch milliseconds (`date.getTime()`). */
  timeMs: number;
  /** Observer latitude, degrees, north-positive, [-90, 90]. */
  latitude: number;
  /** Observer longitude, degrees, east-positive, [-180, 180]. */
  longitude: number;
  /** Observer elevation above sea level, metres. Default 0. */
  elevation?: number;
  /** Annual-average local pressure, Pa. Default 101325. */
  pressure?: number;
  /** Annual-average local temperature, °C. Default 12. */
  temperature?: number;
  /** ΔT = TT − UT, seconds. Default 67. */
  deltaT?: number;
}

/** Topocentric solar position. Angles in degrees. */
export interface SpaResult {
  /** Zenith angle without refraction. */
  zenith: Degrees;
  /** Zenith angle with atmospheric refraction. */
  apparentZenith: Degrees;
  /** Elevation angle without refraction (90 − zenith). */
  elevation: Degrees;
  /** Elevation angle with atmospheric refraction. */
  apparentElevation: Degrees;
  /** Azimuth, from north, clockwise, [0, 360). */
  azimuth: Degrees;
  /** Equation of time, minutes. */
  equationOfTime: number;
}

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
/** Sun radius (0.26667°) + refraction at sunrise/sunset (0.5667°), per SPA. */
const REFRACTION_CUTOFF = -(0.26667 + 0.5667);

/**
 * NREL Solar Position Algorithm (Reda & Andreas 2004/2008) — topocentric sun
 * zenith, azimuth and equation of time, ±0.0003° over years −2000..6000.
 *
 * @example
 * spa({ timeMs: Date.UTC(2003, 9, 17, 19, 30, 30), latitude: 39.742476, longitude: -105.1786 });
 */
export const spa = (input: SpaInput): SpaResult => {
  const {
    timeMs,
    latitude,
    longitude,
    elevation = 0,
    pressure = 101_325,
    temperature = 12,
    deltaT = 67,
  } = input;
  if (!Number.isFinite(timeMs)) throw new RangeError(`timeMs must be finite, got ${timeMs}`);
  if (!(Math.abs(latitude) <= 90)) throw new RangeError(`latitude out of [-90, 90]: ${latitude}`);
  if (!(Math.abs(longitude) <= 180)) {
    throw new RangeError(`longitude out of [-180, 180]: ${longitude}`);
  }

  const { jme, r, deltaPsi, epsRad, nu, alpha, deltaRad: delta } = geocentric(timeMs, deltaT);

  // 3.11 Observer local hour angle.
  const hRad = limitDegrees(nu + longitude - alpha) * D2R;

  // 3.12 Topocentric declination and hour angle (parallax).
  const xiRad = (8.794 / (3600 * r)) * D2R;
  const latRad = latitude * D2R;
  const uRad = Math.atan(0.99664719 * Math.tan(latRad));
  const x = Math.cos(uRad) + (elevation / 6_378_140) * Math.cos(latRad);
  const y = 0.99664719 * Math.sin(uRad) + (elevation / 6_378_140) * Math.sin(latRad);
  const denom = Math.cos(delta) - x * Math.sin(xiRad) * Math.cos(hRad);
  const deltaAlpha = Math.atan2(-x * Math.sin(xiRad) * Math.sin(hRad), denom);
  const deltaPrime = Math.atan2(
    (Math.sin(delta) - y * Math.sin(xiRad)) * Math.cos(deltaAlpha),
    denom,
  );
  const hPrime = hRad - deltaAlpha;

  // 3.14 Topocentric elevation, with refraction applied only above the cutoff.
  const e0 =
    Math.asin(
      Math.sin(latRad) * Math.sin(deltaPrime) +
        Math.cos(latRad) * Math.cos(deltaPrime) * Math.cos(hPrime),
    ) * R2D;
  const deltaE =
    e0 >= REFRACTION_CUTOFF
      ? ((pressure / 100 / 1010) * (283 / (273 + temperature)) * 1.02) /
        (60 * Math.tan((e0 + 10.3 / (e0 + 5.11)) * D2R))
      : 0;
  const e = e0 + deltaE;

  // 3.15 Topocentric azimuth, from north, clockwise.
  const gamma =
    Math.atan2(
      Math.sin(hPrime),
      Math.cos(hPrime) * Math.sin(latRad) - Math.tan(deltaPrime) * Math.cos(latRad),
    ) * R2D;
  const azimuth = limitDegrees(gamma + 180);

  // A.1 Equation of time, minutes, wrapped into (−20, 20].
  const m =
    280.4664567 +
    jme *
      (360_007.6982779 +
        jme * (0.03032028 + jme * (1 / 49_931 + jme * (-1 / 15_300 + jme * (-1 / 2_000_000)))));
  let eot = limitDegrees(m - 0.0057183 - alpha + deltaPsi * Math.cos(epsRad)) * 4;
  if (eot > 20) eot -= 1440;

  return {
    zenith: degrees(90 - e0),
    apparentZenith: degrees(90 - e),
    elevation: degrees(e0),
    apparentElevation: degrees(e),
    azimuth,
    equationOfTime: eot,
  };
};
