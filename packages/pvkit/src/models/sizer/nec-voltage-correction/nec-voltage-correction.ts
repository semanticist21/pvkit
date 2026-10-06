/** NEC Table 690.7(A): [lowest ambient bucket floor in °C, Voc correction factor]. */
const TABLE: readonly (readonly [number, number])[] = [
  [20, 1.02],
  [15, 1.04],
  [10, 1.06],
  [5, 1.08],
  [0, 1.1],
  [-5, 1.12],
  [-10, 1.14],
  [-15, 1.16],
  [-20, 1.18],
  [-25, 1.2],
  [-30, 1.21],
  [-35, 1.23],
  [-40, 1.25],
];

/** Inputs for {@link necVoltageCorrection}. */
export interface NecVoltageCorrectionInput {
  /** Lowest expected ambient temperature, °C. */
  tempMin: number;
}

/**
 * Voc correction factor for crystalline/multicrystalline silicon from NEC Table 690.7(A),
 * for when the manufacturer gives no temperature coefficient. Multiply STC `voc` by it.
 * Temperatures between the table's whole-degree rows fall to the colder row (conservative);
 * ≥ 25 °C gives 1. Below −40 °C the table has no row → RangeError.
 *
 * @example
 * necVoltageCorrection({ tempMin: -12 }); // 1.16
 */
export const necVoltageCorrection = (input: NecVoltageCorrectionInput): number => {
  const { tempMin } = input;
  if (tempMin >= 25) return 1;
  for (const [floor, factor] of TABLE) if (tempMin >= floor) return factor;
  throw new RangeError(`NEC Table 690.7(A) covers −40 °C and warmer, got ${tempMin}`);
};
