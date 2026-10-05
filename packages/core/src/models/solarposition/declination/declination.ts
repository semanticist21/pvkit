import { type Degrees, degrees } from "../../../units.ts";

/** Inputs for the declination helpers. */
export interface DeclinationInput {
  /** Day of year, 1 = 1 January (fractional allowed). */
  dayOfYear: number;
}

const R2D = 180 / Math.PI;

/** Day angle `Γ = 2π(n − 1)/365`, radians (Spencer 1971). */
const dayAngle = (dayOfYear: number) => ((2 * Math.PI) / 365) * (dayOfYear - 1);

/**
 * Solar declination, degrees — Spencer (1971) Fourier series (max error ~0.035°).
 *
 * @example declinationSpencer71({ dayOfYear: 172 }); // ≈ 23.45°
 */
export const declinationSpencer71 = ({ dayOfYear }: DeclinationInput): Degrees => {
  const g = dayAngle(dayOfYear);
  return degrees(
    (0.006918 -
      0.399912 * Math.cos(g) +
      0.070257 * Math.sin(g) -
      0.006758 * Math.cos(2 * g) +
      0.000907 * Math.sin(2 * g) -
      0.002697 * Math.cos(3 * g) +
      0.00148 * Math.sin(3 * g)) *
      R2D,
  );
};

/** Solar declination, degrees — Cooper (1969): `δ = 23.45° sin(2π(284 + n)/365)`. */
export const declinationCooper69 = ({ dayOfYear }: DeclinationInput): Degrees =>
  degrees(23.45 * Math.sin(dayAngle(dayOfYear) + ((2 * Math.PI) / 365) * 285));
