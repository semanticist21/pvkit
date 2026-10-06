import { compensatedSum } from "../../../sum.ts";

/**
 * Specific (final) yield `Y_f = ΣE / P0`, kWh/kWp (= equivalent full-load hours), per
 * IEC 61724-1.
 *
 * @example
 * specificYield({ energy: [400, 600], pdc0Kw: 5 }); // 200
 */
export const specificYield = (input: {
  /** Delivered energy per interval, kWh (a one-element total is fine). */
  energy: ArrayLike<number>;
  /** Array STC (nameplate DC) power, kWp, > 0. */
  pdc0Kw: number;
}): number => {
  const { energy, pdc0Kw } = input;
  if (!(pdc0Kw > 0 && Number.isFinite(pdc0Kw))) {
    throw new RangeError(`pdc0Kw must be finite and > 0, got ${pdc0Kw}`);
  }
  return compensatedSum(energy) / pdc0Kw;
};
