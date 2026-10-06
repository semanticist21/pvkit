/**
 * SPA geocentric stage (Reda & Andreas 2008, §3.1–3.10) shared by `spa`, `sunrise-spa`
 * and `earth-sun-distance`. Private to the solarposition module — not re-exported.
 */
import { limitDegrees } from "../../../units.ts";
import { B_TERMS, L_TERMS, NUTATION_ABCD, NUTATION_Y, R_TERMS } from "./spa-terms.ts";

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const MS_PER_DAY = 86_400_000;
const JD_UNIX_EPOCH = 2_440_587.5;
const J2000 = 2_451_545;

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

/** 3.1 Julian day / century / millennium (time derived from ms, never accumulated). */
const julian = (timeMs: number, deltaT: number) => {
  const jd = timeMs / MS_PER_DAY + JD_UNIX_EPOCH;
  const jde = jd + deltaT / 86_400;
  const jc = (jd - J2000) / 36_525;
  const jce = (jde - J2000) / 36_525;
  return { jd, jc, jce, jme: jce / 10 };
};

/** Earth radius vector R, AU (SPA §3.2). */
export const earthRadiusVector = (timeMs: number, deltaT: number): number =>
  earthSeries(R_TERMS, julian(timeMs, deltaT).jme);

/** Geocentric SPA quantities at one instant. Degrees unless suffixed `Rad`. */
export interface Geocentric {
  jme: number;
  /** Earth radius vector, AU. */
  r: number;
  /** Nutation in longitude. */
  deltaPsi: number;
  /** True obliquity of the ecliptic. */
  epsRad: number;
  /** Apparent sidereal time at Greenwich (ν0 wrapped to [0, 360), plus nutation). */
  nu: number;
  /** Geocentric right ascension, [0, 360). */
  alpha: number;
  /** Geocentric declination. */
  deltaRad: number;
}

/** SPA §3.1–3.10: Earth position → nutation → obliquity → sidereal time, α, δ. */
export const geocentric = (timeMs: number, deltaT: number): Geocentric => {
  const { jd, jc, jce, jme } = julian(timeMs, deltaT);

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
  const deltaRad = Math.asin(
    Math.sin(betaRad) * Math.cos(epsRad) +
      Math.cos(betaRad) * Math.sin(epsRad) * Math.sin(lambdaRad),
  );

  return { jme, r, deltaPsi, epsRad, nu, alpha, deltaRad };
};
