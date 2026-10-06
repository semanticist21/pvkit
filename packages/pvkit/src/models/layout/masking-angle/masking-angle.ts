import type { Degrees } from "../../../units.ts";

const D2R = Math.PI / 180;

export interface MaskingAngleInput {
  /** Degrees from horizontal. */
  surfaceTilt: number;
  /** Ground coverage ratio: row slant length / row pitch. */
  gcr: number;
  /** Point up the slant, fraction 0 (bottom, SAM's worst case) – 1 (top). */
  slantHeight: number;
}

/**
 * Elevation angle, degrees, below which the row in front blocks sky diffuse at a point on
 * the module (Passias & Källbäck 1984, eq. 8, non-dimensionalised by pitch).
 *
 * @example maskingAngle({ surfaceTilt: 30, gcr: 0.5, slantHeight: 0 }); // ≈ 23.8
 */
export const maskingAngle = ({ surfaceTilt, gcr, slantHeight }: MaskingAngleInput): Degrees => {
  const g = gcr * (1 - slantHeight);
  return (Math.atan((g * Math.sin(surfaceTilt * D2R)) / (1 - g * Math.cos(surfaceTilt * D2R))) /
    D2R) as Degrees;
};
