/** Inputs for {@link ross}. */
export interface RossInput {
  /** Plane-of-array irradiance, W/m². */
  poaGlobal: number;
  /** Ambient dry-bulb air temperature, °C. */
  tempAir: number;
  /** Nominal operating cell temperature (800 W/m², 20 °C air, 1 m/s wind), °C. */
  noct: number;
}

/**
 * Ross (1981) cell temperature, °C: `Tc = Ta + (NOCT − 20)/80 · E/10` (E in W/m²; /10 turns
 * it into the paper's mW/cm²). Exactly NOCT at 800 W/m² and 20 °C.
 */
export const ross = ({ poaGlobal, tempAir, noct }: RossInput): number =>
  tempAir + ((noct - 20) / 80) * poaGlobal * 0.1;
