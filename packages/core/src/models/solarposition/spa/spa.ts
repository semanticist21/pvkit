import { type Degrees, degrees, limitDegrees } from "../../../units.ts";
import { B_TERMS, L_TERMS, NUTATION_ABCD, NUTATION_Y, R_TERMS } from "./spa-terms.ts";

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
const MS_PER_DAY = 86_400_000;
const JD_UNIX_EPOCH = 2_440_587.5;
const J2000 = 2_451_545;
/** Sun radius (0.26667°) + refraction at sunrise/sunset (0.5667°), per SPA. */
const REFRACTION_CUTOFF = -(0.26667 + 0.5667);

/** Σ_i (Σ_rows A·cos(B + C·JME)) · JME^i — SPA eqs. 9–11. */
const earthSeries = (
  terms: readonly (readonly (readonly [number, number, number])[])[],
  jme: number,
) => {
  let sum = 0;
  let pow = 1;
  for (const group of terms) {
    let s = 0;
    for (const [a, b, c] of group) s += a * Math.cos(b + c * jme);
    sum += s * pow;
    pow *= jme;
  }
  return sum / 1e8;
};

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

  // 3.1 Julian day / century / millennium (time derived from ms, never accumulated).
  const jd = timeMs / MS_PER_DAY + JD_UNIX_EPOCH;
  const jde = jd + deltaT / 86_400;
  const jc = (jd - J2000) / 36_525;
  const jce = (jde - J2000) / 36_525;
  const jme = jce / 10;

  // 3.2 Earth heliocentric longitude, latitude (deg), radius vector (AU).
  const l = limitDegrees(earthSeries(L_TERMS, jme) * R2D);
  const b = earthSeries(B_TERMS, jme) * R2D;
  const r = earthSeries(R_TERMS, jme);

  // 3.3 Geocentric longitude / latitude.
  const theta = limitDegrees(l + 180);
  const beta = -b;

  // 3.4 Nutation in longitude and obliquity.
  const jce2 = jce * jce;
  const jce3 = jce2 * jce;
  const x0 = 297.85036 + 445_267.11148 * jce - 0.0019142 * jce2 + jce3 / 189_474;
  const x1 = 357.52772 + 35_999.05034 * jce - 0.0001603 * jce2 - jce3 / 300_000;
  const x2 = 134.96298 + 477_198.867398 * jce + 0.0086972 * jce2 + jce3 / 56_250;
  const x3 = 93.27191 + 483_202.017538 * jce - 0.0036825 * jce2 + jce3 / 327_270;
  const x4 = 125.04452 - 1934.136261 * jce + 0.0020708 * jce2 + jce3 / 450_000;
  let psiSum = 0;
  let epsSum = 0;
  for (let i = 0; i < NUTATION_Y.length; i++) {
    const [y0, y1, y2, y3, y4] = NUTATION_Y[i] as (typeof NUTATION_Y)[number];
    const [na, nb, nc, nd] = NUTATION_ABCD[i] as (typeof NUTATION_ABCD)[number];
    const arg = (y0 * x0 + y1 * x1 + y2 * x2 + y3 * x3 + y4 * x4) * D2R;
    psiSum += (na + nb * jce) * Math.sin(arg);
    epsSum += (nc + nd * jce) * Math.cos(arg);
  }
  const deltaPsi = psiSum / 36_000_000;
  const deltaEps = epsSum / 36_000_000;

  // 3.5 True obliquity of the ecliptic.
  const u = jme / 10;
  const eps0 =
    84_381.448 +
    u *
      (-4680.93 +
        u *
          (-1.55 +
            u *
              (1999.25 +
                u *
                  (-51.38 +
                    u *
                      (-249.67 +
                        u * (-39.05 + u * (7.12 + u * (27.87 + u * (5.79 + u * 2.45)))))))));
  const eps = eps0 / 3600 + deltaEps;
  const epsRad = eps * D2R;

  // 3.6–3.7 Aberration correction, apparent sun longitude.
  const lambda = theta + deltaPsi - 20.4898 / (3600 * r);
  const lambdaRad = lambda * D2R;
  const betaRad = beta * D2R;

  // 3.8 Apparent sidereal time at Greenwich.
  const nu0 = limitDegrees(
    280.46061837 +
      360.98564736629 * (jd - J2000) +
      0.000387933 * jc * jc -
      (jc * jc * jc) / 38_710_000,
  );
  const nu = nu0 + deltaPsi * Math.cos(epsRad);

  // 3.9–3.10 Geocentric sun right ascension and declination.
  const alpha = limitDegrees(
    Math.atan2(
      Math.sin(lambdaRad) * Math.cos(epsRad) - Math.tan(betaRad) * Math.sin(epsRad),
      Math.cos(lambdaRad),
    ) * R2D,
  );
  const delta = Math.asin(
    Math.sin(betaRad) * Math.cos(epsRad) +
      Math.cos(betaRad) * Math.sin(epsRad) * Math.sin(lambdaRad),
  );

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
