/**
 * Inputs for {@link stringSize}. Field names match `@pvkit/spec` records, so a
 * `CecInverter` can be spread in directly.
 */
export interface StringSizeInput {
  /** Module open-circuit voltage at the coldest expected cell temperature, V. */
  vocMax: number;
  /** Module max-power voltage at the hottest expected cell temperature, V. */
  vmpMin: number;
  /** Module max-power current, A. */
  imp: number;
  /** Inverter maximum DC input voltage, V. */
  vdcMax: number;
  /** Lower bound of the inverter MPPT window, V. */
  mpptLow: number;
  /** Inverter maximum DC input current, A. */
  idcMax: number;
}

/** Result of {@link stringSize}. */
export interface StringSize {
  /** Fewest modules in series that keep the hot-day string Vmp ≥ `mpptLow`. */
  minSeries: number;
  /** Most modules in series that keep the cold-day string Voc ≤ `vdcMax` (safety limit). */
  maxSeries: number;
  /** Most parallel strings whose summed `imp` stays ≤ `idcMax` (beyond it the inverter clips). */
  maxParallel: number;
}

const positive = (name: string, v: number) => {
  if (!(v > 0 && Number.isFinite(v))) throw new RangeError(`${name} must be > 0, got ${v}`);
};

/**
 * Series/parallel limits of a string array on one inverter input:
 * `maxSeries = ⌊vdcMax / vocMax⌋`, `minSeries = ⌈mpptLow / vmpMin⌉`,
 * `maxParallel = ⌊idcMax / imp⌋`. No valid string length when `minSeries > maxSeries`.
 *
 * @example
 * stringSize({ vocMax: 42.87, vmpMin: 26.1, imp: 8.81, vdcMax: 600, mpptLow: 250, idcMax: 18 });
 * // { minSeries: 10, maxSeries: 13, maxParallel: 2 }
 */
export const stringSize = (input: StringSizeInput): StringSize => {
  const { vocMax, vmpMin, imp, vdcMax, mpptLow, idcMax } = input;
  positive("vocMax", vocMax);
  positive("vmpMin", vmpMin);
  positive("imp", imp);
  positive("vdcMax", vdcMax);
  positive("idcMax", idcMax);
  if (!(mpptLow >= 0)) throw new RangeError(`mpptLow must be ≥ 0, got ${mpptLow}`);
  return {
    minSeries: Math.max(1, Math.ceil(mpptLow / vmpMin)),
    maxSeries: Math.floor(vdcMax / vocMax),
    maxParallel: Math.floor(idcMax / imp),
  };
};
