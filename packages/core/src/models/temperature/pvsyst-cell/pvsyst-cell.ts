/** Inputs for {@link pvsystCell}. */
export interface PvsystCellInput {
  /** Plane-of-array irradiance, W/m². */
  poaGlobal: number;
  /** Ambient dry-bulb air temperature, °C. */
  tempAir: number;
  /** Wind speed at the height `uV` was fitted for, m/s. Default 1 (NOCT condition). */
  windSpeed?: number;
  /** Constant heat-loss factor Uc, W/(m²·K). Default 29 (freestanding). */
  uC?: number;
  /** Wind heat-loss factor Uv, W/(m²·K·m/s). Default 0. */
  uV?: number;
  /** Module external efficiency ηm, fraction. Default 0.1. */
  moduleEfficiency?: number;
  /** Absorption coefficient α, fraction. Default 0.9. */
  alphaAbsorption?: number;
}

/**
 * PVsyst cell temperature, °C: `Tc = Ta + α·E·(1 − ηm) / (Uc + Uv·WS)`.
 * Presets for `uC`/`uV`: `PVSYST_TEMPERATURE_PARAMETERS`.
 */
export const pvsystCell = ({
  poaGlobal,
  tempAir,
  windSpeed = 1,
  uC = 29,
  uV = 0,
  moduleEfficiency = 0.1,
  alphaAbsorption = 0.9,
}: PvsystCellInput): number =>
  tempAir + (poaGlobal * alphaAbsorption * (1 - moduleEfficiency)) / (uC + uV * windSpeed);
