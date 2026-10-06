import { compensatedSum } from "../../../sum.ts";

/**
 * Time-based availability `A = Σa_i / N`: available periods over total periods
 * (IEC 61724-1 / Marion et al. 2005). Each entry is 1 (available), 0 (unavailable) or the
 * available fraction of that period. Drop excluded periods (e.g. night, force majeure)
 * before calling.
 *
 * @example
 * availability({ available: [1, 1, 0, 1] }); // 0.75
 */
export const availability = (input: {
  /** Per-period availability in [0, 1]; non-empty. */
  available: ArrayLike<number>;
}): number => {
  const { available } = input;
  if (available.length === 0) throw new RangeError("available must be non-empty");
  for (let i = 0; i < available.length; i++) {
    const a = available[i] as number;
    if (!(a >= 0 && a <= 1)) throw new RangeError(`available[${i}] out of [0, 1]: ${a}`);
  }
  return compensatedSum(available) / available.length;
};
