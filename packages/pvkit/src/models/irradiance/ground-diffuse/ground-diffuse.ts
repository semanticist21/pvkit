/** Inputs for {@link groundDiffuse}. */
export interface GroundDiffuseInput {
  /** Panel tilt from horizontal, degrees, [0, 180]. */
  surfaceTilt: number;
  /** Global horizontal irradiance, W/m². */
  ghi: number;
  /** Ground albedo, 0..1. Default 0.25. */
  albedo?: number;
}

/** Ground-reflected diffuse on a tilted plane, W/m²: `ghi · albedo · (1 − cos β) / 2`. */
export const groundDiffuse = (input: GroundDiffuseInput): number => {
  const { surfaceTilt, ghi, albedo = 0.25 } = input;
  return ghi * albedo * (1 - Math.cos(surfaceTilt * (Math.PI / 180))) * 0.5;
};
