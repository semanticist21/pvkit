/** Inputs for {@link voltageAtTemperature}. */
export interface VoltageAtTemperatureInput {
  /** Voltage at `tempRef` (datasheet `voc` or `vmp`), V. */
  voltage: number;
  /**
   * Temperature coefficient of that voltage, V/°C (negative for silicon). From a datasheet
   * %/°C value: `voltage · pct / 100`.
   */
  beta: number;
  /** Cell temperature, °C: the lowest expected ambient for `voc`, the hottest cell for `vmp`. */
  tempCell: number;
  /** Reference temperature of `voltage`, °C. Default 25 (STC). */
  tempRef?: number;
}

/**
 * Module voltage at a cell temperature by the manufacturer's coefficient
 * (NEC 690.7(A)(1)): `V(T) = V + β·(T − Tref)`, V.
 * Cold-dawn `voc` gives the maximum string voltage; hot-cell `vmp` the minimum MPP voltage.
 *
 * @example
 * voltageAtTemperature({ voltage: 38.63, beta: -0.1212, tempCell: -10 }); // 42.872
 */
export const voltageAtTemperature = (input: VoltageAtTemperatureInput): number => {
  const { voltage, beta, tempCell, tempRef = 25 } = input;
  return voltage + beta * (tempCell - tempRef);
};
