import type { SunriseResult } from "../sunrise-spa/sunrise-spa.ts";

/** Inputs for {@link sunriseGeometric}. */
export interface SunriseGeometricInput {
  /** Any instant of the day of interest, UTC epoch ms; floored to 00:00 UTC of that day. */
  timeMs: number;
  /** Observer latitude, degrees, north-positive. */
  latitude: number;
  /** Observer longitude, degrees, east-positive. */
  longitude: number;
  /** Solar declination for that day, degrees (e.g. `declinationSpencer71`). */
  declination: number;
  /** Equation of time for that day, minutes (e.g. `equationOfTimeSpencer71`). */
  equationOfTime: number;
}

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const MS_PER_DAY = 86_400_000;

/**
 * Geometric sunrise, sunset and transit (Duffie & Beckman): sunset hour angle
 * `ωs = acos(−tan δ · tan φ)`, event at UTC hour `(ω − longitude − E/4)/15 + 12` after
 * 00:00 UTC of the day. Point-source sun, circular orbit, no refraction — error of order
 * 10 min. `sunrise`/`sunset` are `NaN` in polar day/night (|tan δ tan φ| > 1).
 */
export const sunriseGeometric = (input: SunriseGeometricInput): SunriseResult => {
  const { timeMs, latitude, longitude, declination, equationOfTime } = input;
  if (!Number.isFinite(timeMs)) throw new RangeError(`timeMs must be finite, got ${timeMs}`);
  if (!(Math.abs(latitude) <= 90)) throw new RangeError(`latitude out of [-90, 90]: ${latitude}`);
  if (!(Math.abs(longitude) <= 180)) {
    throw new RangeError(`longitude out of [-180, 180]: ${longitude}`);
  }
  const utday = Math.floor(timeMs / MS_PER_DAY) * MS_PER_DAY;
  const sunsetAngle = Math.acos(-Math.tan(declination * D2R) * Math.tan(latitude * D2R)) * R2D;
  const at = (omega: number) =>
    utday + ((omega - longitude - equationOfTime / 4) / 15 + 12) * 3_600_000;
  return { sunrise: at(-sunsetAngle), sunset: at(sunsetAngle), transit: at(0) };
};
