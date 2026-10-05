/** Inputs for {@link faiman}. */
export interface FaimanInput {
  /** Plane-of-array irradiance, W/m². */
  poaGlobal: number;
  /** Ambient dry-bulb air temperature, °C. */
  tempAir: number;
  /** Wind speed at the height `u1` was fitted for, m/s. Default 1. */
  windSpeed?: number;
  /** Constant heat-transfer coefficient U0, W/(m²·K). Default 25 (Faiman 2008). */
  u0?: number;
  /** Wind heat-transfer coefficient U1, W/(m²·K·m/s). Default 6.84 (Faiman 2008). */
  u1?: number;
}

/**
 * Faiman (2008) module temperature, °C — also IEC 61853-2/-3: `Tm = Ta + E / (U0 + U1·WS)`.
 */
export const faiman = ({
  poaGlobal,
  tempAir,
  windSpeed = 1,
  u0 = 25,
  u1 = 6.84,
}: FaimanInput): number => tempAir + poaGlobal / (u0 + u1 * windSpeed);
