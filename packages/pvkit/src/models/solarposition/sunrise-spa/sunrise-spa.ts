import { geocentric } from "../spa/spa-geocentric.ts";

/** Inputs for {@link sunriseSpa}. */
export interface SunriseSpaInput {
  /** Any instant of the day of interest, UTC epoch ms; floored to 00:00 UTC of that day. */
  timeMs: number;
  /** Observer latitude, degrees, north-positive, [-90, 90]. */
  latitude: number;
  /** Observer longitude, degrees, east-positive, [-180, 180]. */
  longitude: number;
  /** ΔT = TT − UT, seconds. Default 67. */
  deltaT?: number;
}

/** Sun events as UTC epoch ms; `NaN` when the event does not occur (polar day/night). */
export interface SunriseResult {
  sunrise: number;
  sunset: number;
  transit: number;
}

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const MS_PER_DAY = 86_400_000;
/** Sun radius + standard refraction at the horizon, degrees (SPA A.2). */
const H0_PRIME = -0.8333;

/** Python-style modulo (result has the sign of `m`), as in the reference implementation. */
const pyMod = (x: number, m: number) => ((x % m) + m) % m;
/** SPA A.2 eq. A9: wrap a day-to-day α/δ difference when it jumps across 0/360. */
const unwrap = (d: number) => (Math.abs(d) > 2 ? pyMod(d, 1) : d);

/**
 * Sunrise, sunset and transit for one UTC day via the NREL SPA (Reda & Andreas 2008,
 * Appendix A.2): geocentric α/δ at 0h TT of days −1, 0, +1, interpolated to each event,
 * with h₀′ = −0.8333° (sun radius + refraction). Sunrise may fall on the previous UTC day
 * and sunset on the next one. For a local calendar day pass `Date.UTC(y, m, d)` of that
 * local date.
 *
 * @example
 * sunriseSpa({ timeMs: Date.UTC(2003, 9, 17), latitude: 39.742476, longitude: -105.1786 });
 */
export const sunriseSpa = (input: SunriseSpaInput): SunriseResult => {
  const { timeMs, latitude, longitude, deltaT = 67 } = input;
  if (!Number.isFinite(timeMs)) throw new RangeError(`timeMs must be finite, got ${timeMs}`);
  if (!(Math.abs(latitude) <= 90)) throw new RangeError(`latitude out of [-90, 90]: ${latitude}`);
  if (!(Math.abs(longitude) <= 180)) {
    throw new RangeError(`longitude out of [-180, 180]: ${longitude}`);
  }

  const utday = Math.floor(timeMs / MS_PER_DAY) * MS_PER_DAY;
  const tt0 = utday - deltaT * 1000;
  const nu = geocentric(utday, deltaT).nu;
  const g0 = geocentric(tt0, deltaT);
  const gm = geocentric(tt0 - MS_PER_DAY, deltaT);
  const gp = geocentric(tt0 + MS_PER_DAY, deltaT);
  const alpha0 = g0.alpha;
  const delta0 = g0.deltaRad * R2D;
  const deltaM = gm.deltaRad * R2D;
  const deltaP = gp.deltaRad * R2D;
  const latRad = latitude * D2R;

  // A.2 eqs. A1–A3: approximate transit, local hour angle at sunrise/sunset.
  const m0 = (alpha0 - longitude - nu) / 360;
  const cosArg =
    (Math.sin(H0_PRIME * D2R) - Math.sin(latRad) * Math.sin(delta0 * D2R)) /
    (Math.cos(latRad) * Math.cos(delta0 * D2R));
  const h0 = Math.abs(cosArg) > 1 ? Number.NaN : pyMod(Math.acos(cosArg) * R2D, 180);

  const mT = pyMod(m0, 1);
  const mRraw = mT - h0 / 360;
  const mSraw = mT + h0 / 360;
  const mR = pyMod(mRraw, 1);
  const mS = pyMod(mSraw, 1);

  // A.2 eqs. A8–A10: interpolate α′, δ′ to each event.
  const a = unwrap(alpha0 - gm.alpha);
  const ap = unwrap(delta0 - deltaM);
  const b = unwrap(gp.alpha - alpha0);
  const bp = unwrap(deltaP - delta0);
  const c = b - a;
  const cp = bp - ap;
  const event = (m: number) => {
    const n = m + deltaT / 86_400;
    const alphaPrime = alpha0 + (n * (a + b + c * n)) / 2;
    const deltaPrime = (delta0 + (n * (ap + bp + cp * n)) / 2) * D2R;
    let hp = pyMod(nu + 360.985647 * m + longitude - alphaPrime, 360);
    if (hp >= 180) hp -= 360;
    const h =
      Math.asin(
        Math.sin(latRad) * Math.sin(deltaPrime) +
          Math.cos(latRad) * Math.cos(deltaPrime) * Math.cos(hp * D2R),
      ) * R2D;
    return { hp, h, deltaPrime };
  };

  // A.2 eqs. A11–A16: transit and the sunrise/sunset corrections, in fractions of a day.
  const t = event(mT);
  const crossing = (m: number) => {
    const e = event(m);
    return (
      m +
      (e.h - H0_PRIME) / (360 * Math.cos(e.deltaPrime) * Math.cos(latRad) * Math.sin(e.hp * D2R))
    );
  };
  let rise = crossing(mR);
  let set = crossing(mS);
  if (mRraw < 0) rise -= 1;
  if (mSraw >= 1) set += 1;

  return {
    sunrise: utday + rise * MS_PER_DAY,
    sunset: utday + set * MS_PER_DAY,
    transit: utday + (mT - t.hp / 360) * MS_PER_DAY,
  };
};
