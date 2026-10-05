import { degrees, toRadians } from "../../../units.ts";

/** Inputs for {@link martinRuiz}. */
export interface MartinRuizInput {
  /** Angle of incidence between module normal and sun beam, degrees. */
  aoi: number;
  /** Angular losses coefficient, unitless, > 0. Default 0.16. */
  aR?: number;
}

/**
 * Martin & Ruiz (2001) IAM: `IAM = (1 − exp(−cos aoi / a_r)) / (1 − exp(−1 / a_r))`,
 * 0 for |aoi| ≥ 90. NaN aoi → NaN.
 *
 * @throws RangeError if `aR` is not > 0.
 * @example
 * martinRuiz({ aoi: 60 }); // ≈ 0.9579
 */
export const martinRuiz = ({ aoi, aR = 0.16 }: MartinRuizInput): number => {
  if (!(aR > 0)) throw new RangeError(`aR must be > 0, got ${aR}`);
  if (Math.abs(aoi) >= 90) return 0;
  return (1 - Math.exp(-Math.cos(toRadians(degrees(aoi))) / aR)) / (1 - Math.exp(-1 / aR));
};
