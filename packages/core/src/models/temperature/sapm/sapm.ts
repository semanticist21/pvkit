/** Inputs for {@link sapmModule}. */
export interface SapmModuleInput {
  /** Plane-of-array irradiance, W/m². */
  poaGlobal: number;
  /** Ambient dry-bulb air temperature, °C. */
  tempAir: number;
  /** Wind speed at 10 m height, m/s. */
  windSpeed: number;
  /** Empirical coefficient `a` (upper limit of module temperature at low wind), unitless. */
  a: number;
  /** Empirical coefficient `b` (rate of cooling with wind), s/m. */
  b: number;
}

/** Inputs for {@link sapmCellFromModule}. */
export interface SapmCellFromModuleInput {
  /** Module back-surface temperature, °C. */
  moduleTemperature: number;
  /** Plane-of-array irradiance, W/m². */
  poaGlobal: number;
  /** Cell − back-surface temperature difference at `irradRef`, °C. */
  deltaT: number;
  /** Reference irradiance E₀, W/m². Default 1000. */
  irradRef?: number;
}

/** Inputs for {@link sapmCell}. */
export interface SapmCellInput extends SapmModuleInput {
  /** Cell − back-surface temperature difference at `irradRef`, °C. */
  deltaT: number;
  /** Reference irradiance E₀, W/m². Default 1000. */
  irradRef?: number;
}

/**
 * SAPM module back-surface temperature, °C (King et al. 2004, eq. 11):
 * `Tm = E·exp(a + b·WS) + Ta`.
 */
export const sapmModule = ({ poaGlobal, tempAir, windSpeed, a, b }: SapmModuleInput): number =>
  poaGlobal * Math.exp(a + b * windSpeed) + tempAir;

/**
 * SAPM cell temperature from back-surface temperature, °C (King et al. 2004, eq. 12):
 * `Tc = Tm + (E / E₀)·ΔT`.
 */
export const sapmCellFromModule = ({
  moduleTemperature,
  poaGlobal,
  deltaT,
  irradRef = 1000,
}: SapmCellFromModuleInput): number => moduleTemperature + (poaGlobal / irradRef) * deltaT;

/**
 * SAPM cell temperature, °C (King et al. 2004, eqs. 11–12). Presets for `a`, `b`, `deltaT`:
 * `SAPM_TEMPERATURE_PARAMETERS`.
 *
 * @example
 * sapmCell({ poaGlobal: 1000, tempAir: 10, windSpeed: 0, ...SAPM_TEMPERATURE_PARAMETERS.openRackGlassGlass });
 */
export const sapmCell = (input: SapmCellInput): number => {
  const { poaGlobal, deltaT, irradRef = 1000 } = input;
  return sapmCellFromModule({ moduleTemperature: sapmModule(input), poaGlobal, deltaT, irradRef });
};
