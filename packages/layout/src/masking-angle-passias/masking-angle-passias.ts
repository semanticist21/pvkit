const D2R = Math.PI / 180;

export interface MaskingAnglePassiasInput {
  /** Degrees from horizontal. */
  surfaceTilt: number;
  /** Ground coverage ratio: row slant length / row pitch. */
  gcr: number;
}

/**
 * Masking angle averaged over the module slant, degrees (Passias & Källbäck 1984, eq. 9).
 * Returns 0 where the closed form is undefined (e.g. flat modules), as pvlib.
 *
 * @example maskingAnglePassias({ surfaceTilt: 30, gcr: 0.5 }); // ≈ 10.0
 */
export const maskingAnglePassias = ({ surfaceTilt, gcr }: MaskingAnglePassiasInput): number => {
  const b = surfaceTilt * D2R;
  const sin = Math.sin(b);
  const cos = Math.cos(b);
  const x = 1 / gcr;
  const psi =
    (-x * sin * Math.log(Math.abs(2 * x * cos - (x * x + 1)))) / 2 +
    (x * cos - 1) * Math.atan((x * cos - 1) / (x * sin)) +
    (1 - x * cos) * Math.atan(cos / sin) +
    x * Math.log(x) * sin;
  return Number.isFinite(psi) ? psi / D2R : 0;
};
