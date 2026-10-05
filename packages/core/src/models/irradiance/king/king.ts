/** Inputs for {@link king}. */
export interface KingInput {
  /** Panel tilt from horizontal, degrees, [0, 180]. */
  surfaceTilt: number;
  /** Diffuse horizontal irradiance, W/m². */
  dhi: number;
  /** Global horizontal irradiance, W/m². */
  ghi: number;
  /** Solar zenith, degrees. */
  solarZenith: number;
}

/**
 * King's empirical sky diffuse on a tilted plane (Sandia), W/m², floored at 0:
 * `dhi(1 + cos β)/2 + ghi(0.012 z − 0.04)(1 − cos β)/2`, z in degrees.
 */
export const king = (input: KingInput): number => {
  const { surfaceTilt, dhi, ghi, solarZenith } = input;
  const cosTilt = Math.cos(surfaceTilt * (Math.PI / 180));
  return Math.max(
    (dhi * (1 + cosTilt)) / 2 + (ghi * (0.012 * solarZenith - 0.04) * (1 - cosTilt)) / 2,
    0,
  );
};
