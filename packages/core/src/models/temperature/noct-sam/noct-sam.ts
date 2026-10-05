/** Inputs for {@link noctSam}. */
export interface NoctSamInput {
  /** Plane-of-array irradiance before reflection losses, W/m². */
  poaGlobal: number;
  /** Ambient dry-bulb air temperature, °C. */
  tempAir: number;
  /** Wind speed at 10 m height, m/s. */
  windSpeed: number;
  /** Nominal operating cell temperature (800 W/m², 20 °C air, 1 m/s wind), °C. */
  noct: number;
  /** Module efficiency at 1000 W/m² and 20 °C, fraction (`Vmp·Imp / (A·1000)`). */
  moduleEfficiency: number;
  /** Irradiance converted to photocurrent, W/m². Default: equal to `poaGlobal`. */
  effectiveIrradiance?: number;
  /** Combined transmittance–absorptance τα, fraction. Default 0.9. */
  transmittanceAbsorptance?: number;
  /** Array height above ground in stories (~3 m each): 1 or 2. Default 1. */
  arrayHeight?: 1 | 2;
  /** Gap between array and mounting surface, inches. Default 4 (ground mount → no adjustment). */
  mountStandoff?: number;
}

/** SAM NOCT increase for a building-mounted array by standoff (inches); pvlib's interval edges. */
const standoffAdjustment = (x: number): number => {
  if (x <= 0) return 0;
  if (x < 0.5) return 18;
  if (x < 1.5) return 11;
  if (x < 2.5) return 6;
  if (x <= 3.5) return 2;
  return 0;
};

/**
 * SAM NOCT cell temperature, °C (Gilman et al. 2018, §10.6, eq. 10.37):
 * `Tc = Ta + E/800·(NOCT′ − 20)·(1 − η/τα′)·9.5/(5.7 + 3.8·v′)` with `NOCT′ = NOCT +
 * standoff adjustment`, `v′ = 0.51·WS` (1 story) or `0.61·WS` (2 stories) and
 * `τα′ = τα·Eeff/E`.
 */
export const noctSam = ({
  poaGlobal,
  tempAir,
  windSpeed,
  noct,
  moduleEfficiency,
  effectiveIrradiance,
  transmittanceAbsorptance = 0.9,
  arrayHeight = 1,
  mountStandoff = 4,
}: NoctSamInput): number => {
  let windAdj: number;
  if (arrayHeight === 1) windAdj = 0.51 * windSpeed;
  else if (arrayHeight === 2) windAdj = 0.61 * windSpeed;
  else throw new RangeError(`arrayHeight must be 1 or 2, got ${arrayHeight}`);
  const irrRatio = effectiveIrradiance === undefined ? 1 : effectiveIrradiance / poaGlobal;
  const tauAlpha = transmittanceAbsorptance * irrRatio;
  const cellTempInit = (poaGlobal / 800) * (noct + standoffAdjustment(mountStandoff) - 20);
  const heatLoss = 1 - moduleEfficiency / tauAlpha;
  const windLoss = 9.5 / (5.7 + 3.8 * windAdj);
  return tempAir + cellTempInit * heatLoss * windLoss;
};
