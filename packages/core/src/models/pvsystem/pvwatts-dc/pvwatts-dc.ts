/** Inputs for {@link pvwattsDc}. */
export interface PvwattsDcInput {
  /** Irradiance reaching the cells (AOI losses applied, not soiling/spectral), W/m². */
  effectiveIrradiance: number;
  /** Cell temperature, °C. */
  tempCell: number;
  /** Array DC power at 1000 W/m² and `tempRef`, W. Must be ≥ 0. */
  pdc0: number;
  /** Temperature coefficient of power, 1/°C (typically −0.002 … −0.005). */
  gammaPdc: number;
  /** Cell reference temperature, °C. Default 25 (pvlib default, PVWatts definition). */
  tempRef?: number;
}

/**
 * PVWatts V5 DC power (Dobos 2014):
 * `P = G/1000 · pdc0 · (1 + γ·(Tcell − Tref))`, W.
 * No clamp — negative irradiance passes through, as in pvlib.
 *
 * @example
 * pvwattsDc({ effectiveIrradiance: 800, tempCell: 45, pdc0: 5000, gammaPdc: -0.004 }); // 3680
 */
export const pvwattsDc = (input: PvwattsDcInput): number => {
  const { effectiveIrradiance, tempCell, pdc0, gammaPdc, tempRef = 25 } = input;
  if (!(pdc0 >= 0)) throw new RangeError(`pdc0 must be ≥ 0, got ${pdc0}`);
  return effectiveIrradiance * 0.001 * pdc0 * (1 + gammaPdc * (tempCell - tempRef));
};
