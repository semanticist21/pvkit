import { type Degrees, degrees, limitDegrees } from "../../../units.ts";

/** Inputs for {@link hourAngle}. */
export interface HourAngleInput {
  /** Instant as UTC epoch milliseconds (`date.getTime()`). */
  timeMs: number;
  /** Observer longitude, degrees, east-positive. */
  longitude: number;
  /** Equation of time, minutes (e.g. from `equationOfTimeSpencer71` or `spa`). */
  equationOfTime: number;
}

const MS_PER_DAY = 86_400_000;

/**
 * Hour angle in local solar time, degrees, zero at solar noon, wrapped to [−180, 180):
 * `ω = 15·(t_UTC − 12) + longitude + E/4` with `t_UTC` the UTC hour of day.
 *
 * @example hourAngle({ timeMs: Date.UTC(2025, 5, 21, 12), longitude: 0, equationOfTime: 0 }); // 0
 */
export const hourAngle = ({ timeMs, longitude, equationOfTime }: HourAngleInput): Degrees => {
  if (!Number.isFinite(timeMs)) throw new RangeError(`timeMs must be finite, got ${timeMs}`);
  const msOfDay = timeMs - Math.floor(timeMs / MS_PER_DAY) * MS_PER_DAY;
  const h = 15 * (msOfDay / 3_600_000 - 12) + longitude + equationOfTime / 4;
  return degrees(limitDegrees(h + 180) - 180);
};
