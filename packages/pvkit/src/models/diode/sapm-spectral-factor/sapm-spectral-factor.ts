/**
 * SAPM spectral factor `F1` (King et al. 2004): `F1 = max(0, A0 + A1·AM + A2·AM² + A3·AM³ + A4·AM⁴)`
 * of absolute air mass; NaN air mass (sun below horizon) → 0, as pvlib.
 * Coefficient names match `pvkit-js/spec` `SandiaModule`.
 *
 * @example
 * sapmSpectralFactor({ airmassAbsolute: 1.5, a0: 0.928, a1: 0.068, a2: -0.0077, a3: 0.0001, a4: 0 });
 */
export const sapmSpectralFactor = (input: {
  /** Absolute (pressure-corrected) air mass, unitless (`atmosphere/absolute-airmass`). */
  airmassAbsolute: number;
  a0: number;
  a1: number;
  a2: number;
  a3: number;
  a4: number;
}): number => {
  const { airmassAbsolute: am, a0, a1, a2, a3, a4 } = input;
  const f1 = (((a4 * am + a3) * am + a2) * am + a1) * am + a0; // Horner, as np.polyval
  return Number.isNaN(f1) ? 0 : Math.max(0, f1);
};
