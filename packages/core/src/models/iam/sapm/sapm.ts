/** Inputs for {@link sapm}: the module's SAPM AOI polynomial coefficients B0..B5. */
export interface SapmInput {
  /** Angle of incidence between module normal and sun beam, degrees. */
  aoi: number;
  /** Polynomial coefficient B0 (constant term). */
  b0: number;
  /** Polynomial coefficient B1, 1/deg. */
  b1: number;
  /** Polynomial coefficient B2, 1/deg². */
  b2: number;
  /** Polynomial coefficient B3, 1/deg³. */
  b3: number;
  /** Polynomial coefficient B4, 1/deg⁴. */
  b4: number;
  /** Polynomial coefficient B5, 1/deg⁵. */
  b5: number;
  /** Optional upper limit on the result (e.g. 1). Default: none. */
  upper?: number;
}

/**
 * Sandia Array Performance Model AOI loss `F2` (King et al. 2004):
 * `F2 = B0 + B1·aoi + B2·aoi² + B3·aoi³ + B4·aoi⁴ + B5·aoi⁵`, clipped to `[0, upper]`;
 * 0 for aoi < 0. aoi ≥ 90 is not special-cased (pvlib evaluates the polynomial, clipped ≥ 0).
 *
 * @example
 * sapm({ aoi: 30, b0: 1, b1: -0.002438, b2: 3.103e-4, b3: -1.246e-5, b4: 2.112e-7, b5: -1.359e-9 });
 */
export const sapm = ({ aoi, b0, b1, b2, b3, b4, b5, upper }: SapmInput): number => {
  if (aoi < 0) return 0;
  // Horner, highest order first (numpy polyval order).
  const poly = ((((b5 * aoi + b4) * aoi + b3) * aoi + b2) * aoi + b1) * aoi + b0;
  const lower = Math.max(poly, 0);
  return upper === undefined ? lower : Math.min(lower, upper);
};
