/** Inputs for {@link genericLinear}. */
export interface GenericLinearInput {
  /** Plane-of-array irradiance, W/m². */
  poaGlobal: number;
  /** Ambient dry-bulb air temperature, °C. */
  tempAir: number;
  /** Wind speed at 10 m height, m/s. */
  windSpeed: number;
  /** Combined heat-transfer coefficient at zero wind, W/(m²·K). */
  uConst: number;
  /** Wind influence on the heat-transfer coefficient, W/(m²·K·m/s). */
  duWind: number;
  /** Module electrical efficiency, fraction. */
  moduleEfficiency: number;
  /** Module light absorptance, fraction. */
  absorptance: number;
}

/**
 * Generic linear heat-loss module temperature, °C (Driesse et al. 2022):
 * `Tm = Ta + E·(α − η) / (u_const + du_wind·WS)`. Parameters from other models:
 * `pvkit-js/temperature/generic-linear-model`.
 */
export const genericLinear = ({
  poaGlobal,
  tempAir,
  windSpeed,
  uConst,
  duWind,
  moduleEfficiency,
  absorptance,
}: GenericLinearInput): number =>
  tempAir + (poaGlobal * (absorptance - moduleEfficiency)) / (uConst + duWind * windSpeed);
