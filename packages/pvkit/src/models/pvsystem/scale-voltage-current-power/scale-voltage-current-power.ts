/** Module operating point for {@link scaleVoltageCurrentPower}. */
export interface IvPoint {
  /** Current at max power, A. */
  iMp: number;
  /** Voltage at max power, V. */
  vMp: number;
  /** Short-circuit current, A. */
  iSc: number;
  /** Open-circuit voltage, V. */
  vOc: number;
  /** Max power, W. */
  pMp: number;
}

/** Inputs for {@link scaleVoltageCurrentPower}. */
export interface ScaleVoltageCurrentPowerInput extends IvPoint {
  /** Modules in series per string (voltage factor). Default 1 (pvlib default). */
  seriesModules?: number;
  /** Strings in parallel (current factor). Default 1 (pvlib default). */
  parallelStrings?: number;
}

/**
 * Scale one module's operating point to an array: voltages × `seriesModules`,
 * currents × `parallelStrings`, power × both (pvlib `scale_voltage_current_power`).
 *
 * @example
 * scaleVoltageCurrentPower({ iMp: 9.5, vMp: 40, iSc: 10, vOc: 48, pMp: 380, seriesModules: 20 });
 */
export const scaleVoltageCurrentPower = (input: ScaleVoltageCurrentPowerInput): IvPoint => {
  const { iMp, vMp, iSc, vOc, pMp, seriesModules = 1, parallelStrings = 1 } = input;
  return {
    iMp: iMp * parallelStrings,
    vMp: vMp * seriesModules,
    iSc: iSc * parallelStrings,
    vOc: vOc * seriesModules,
    pMp: pMp * seriesModules * parallelStrings,
  };
};
