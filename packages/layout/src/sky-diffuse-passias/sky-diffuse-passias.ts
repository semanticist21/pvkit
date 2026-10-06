const D2R = Math.PI / 180;

/**
 * Fraction of sky diffuse lost to row-to-row masking, 0–1 (Passias & Källbäck 1984;
 * SAM): `1 − cos²(ψ/2)`. Takes a masking angle in degrees (e.g. {@link
 * import("../masking-angle-passias/index.ts").maskingAnglePassias}).
 *
 * @example skyDiffusePassias({ maskingAngle: 10 }); // ≈ 0.0076
 */
export const skyDiffusePassias = ({ maskingAngle }: { maskingAngle: number }): number =>
  1 - Math.cos((maskingAngle / 2) * D2R) ** 2;
