/**
 * SAPM effective irradiance (King et al. 2004): `Ee = F1·(Eb·F2 + fd·Ed)`, W/m² — the
 * irradiance the cells convert, input to `sapm`. `F1` from `sapmSpectralFactor`, `F2` from
 * `iam/sapm` (AOI loss on the beam).
 *
 * @example
 * sapmEffectiveIrradiance({ poaDirect: 800, poaDiffuse: 100, spectralFactor: 1, iam: 0.99, fd: 1 }); // 892
 */
export const sapmEffectiveIrradiance = (input: {
  /** Beam irradiance on the plane of array, W/m². */
  poaDirect: number;
  /** Diffuse irradiance on the plane of array (sky + ground), W/m². */
  poaDiffuse: number;
  /** Spectral factor `F1`, unitless (`sapmSpectralFactor`). */
  spectralFactor: number;
  /** AOI modifier `F2` on the beam, unitless (`iam/sapm`). */
  iam: number;
  /** Fraction of diffuse irradiance used by the module, unitless (spec `fd`, usually 1). */
  fd: number;
}): number => {
  const { poaDirect, poaDiffuse, spectralFactor, iam, fd } = input;
  return spectralFactor * (poaDirect * iam + fd * poaDiffuse);
};
