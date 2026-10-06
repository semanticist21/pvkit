import { assertFinite } from "../finite.ts";
import { compensatedSum } from "../sum.ts";

/**
 * Simple (undiscounted) return on investment over the whole horizon:
 * `ROI = Σ_{t=0…n} CF_t / (−CF_0)` — net gain per unit invested (0.5 = +50 %).
 *
 * @example
 * roi({ cashFlows: [-1000, 600, 600] }); // 0.2
 */
export const roi = (input: {
  /** Cash flow per period, year 0 first, finite; `cashFlows[0]` (the investment) must be < 0. */
  cashFlows: ArrayLike<number>;
}): number => {
  const { cashFlows } = input;
  assertFinite("cashFlows", cashFlows);
  const cf0 = cashFlows[0];
  if (!(cf0 !== undefined && cf0 < 0)) {
    throw new RangeError(`cashFlows[0] must be a negative investment, got ${cf0}`);
  }
  return compensatedSum(cashFlows) / -cf0;
};
