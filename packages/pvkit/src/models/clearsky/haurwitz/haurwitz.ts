import { degrees, toRadians } from "../../../units.ts";

/** Inputs for {@link haurwitz}. */
export interface HaurwitzInput {
  /** Refraction-corrected solar zenith angle, degrees. */
  apparentZenith: number;
}

/**
 * Haurwitz (1945) clear-sky global horizontal irradiance, W/m²:
 * `GHI = 1098 · cos z · exp(−0.059 / cos z)`, 0 when the sun is at or below the horizon.
 *
 * @example
 * haurwitz({ apparentZenith: 30 }); // ≈ 888 W/m²
 */
export const haurwitz = ({ apparentZenith }: HaurwitzInput): number => {
  const cosZ = Math.cos(toRadians(degrees(apparentZenith)));
  // `cosZ > 0` is also false for NaN → 0, as pvlib.
  return cosZ > 0 ? 1098 * cosZ * Math.exp(-0.059 / cosZ) : 0;
};
