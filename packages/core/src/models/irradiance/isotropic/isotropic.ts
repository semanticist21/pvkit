/** Inputs for {@link isotropic}. */
export interface IsotropicInput {
  /** Panel tilt from horizontal, degrees, [0, 180]. */
  surfaceTilt: number;
  /** Diffuse horizontal irradiance, W/m². */
  dhi: number;
}

/**
 * Isotropic sky diffuse on a tilted plane (Liu & Jordan 1963 / Hottel & Woertz 1942):
 * `dhi · (1 + cos β) / 2`, W/m².
 */
export const isotropic = (input: IsotropicInput): number => {
  const { surfaceTilt, dhi } = input;
  return dhi * (1 + Math.cos(surfaceTilt * (Math.PI / 180))) * 0.5;
};
