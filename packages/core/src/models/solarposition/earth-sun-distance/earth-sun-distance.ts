import { earthRadiusVector } from "../spa/spa-geocentric.ts";

/** Inputs for {@link earthSunDistance}. */
export interface EarthSunDistanceInput {
  /** Instant as UTC epoch milliseconds (`date.getTime()`). */
  timeMs: number;
  /** ΔT = TT − UT, seconds. Default 67. */
  deltaT?: number;
}

/**
 * Earth–Sun distance, AU — the SPA heliocentric radius vector R (Reda & Andreas 2008, §3.2).
 *
 * @example earthSunDistance({ timeMs: Date.UTC(2003, 9, 17, 19, 30, 30) }); // 0.9965422974
 */
export const earthSunDistance = ({ timeMs, deltaT = 67 }: EarthSunDistanceInput): number => {
  if (!Number.isFinite(timeMs)) throw new RangeError(`timeMs must be finite, got ${timeMs}`);
  return earthRadiusVector(timeMs, deltaT);
};
