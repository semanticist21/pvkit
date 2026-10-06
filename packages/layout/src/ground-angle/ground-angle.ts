const D2R = Math.PI / 180;

export interface GroundAngleInput {
  /** Degrees from horizontal. */
  surfaceTilt: number;
  /** Ground coverage ratio: row slant length / row pitch. */
  gcr: number;
  /** Point up the slant, fraction 0 (bottom) – 1 (top). */
  slantHeight: number;
}

/**
 * Angle from horizontal, degrees, of the line from a point on the row slant to the bottom
 * of the facing row — the limit of the ground visible from that point (pvlib
 * `shading.ground_angle`). Measured clockwise from horizontal.
 *
 * @example groundAngle({ surfaceTilt: 30, gcr: 0.5, slantHeight: 1 }); // ≈ 9.9
 */
export const groundAngle = ({ surfaceTilt, gcr, slantHeight }: GroundAngleInput): number =>
  Math.atan2(
    gcr * slantHeight * Math.sin(surfaceTilt * D2R),
    gcr * slantHeight * Math.cos(surfaceTilt * D2R) + 1,
  ) / D2R;
