import { degrees, toRadians } from "../../../units.ts";

/** Inputs for {@link ashrae}. */
export interface AshraeInput {
  /** Angle of incidence between module normal and sun beam, degrees. */
  aoi: number;
  /** Incidence-angle adjustment parameter, unitless. Default 0.05. */
  b?: number;
}

/**
 * ASHRAE transmission IAM (Souka & Safwat 1966; ASHRAE 93-77): `IAM = 1 − b·(sec aoi − 1)`,
 * clamped to ≥ 0 and set to 0 for |aoi| ≥ 90. NaN aoi → NaN.
 *
 * @example
 * ashrae({ aoi: 60 }); // 0.95
 */
export const ashrae = ({ aoi, b = 0.05 }: AshraeInput): number => {
  if (Math.abs(aoi) >= 90) return 0;
  return Math.max(0, 1 - b * (1 / Math.cos(toRadians(degrees(aoi))) - 1));
};
