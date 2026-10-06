import { assertFinite } from "../finite.ts";
import { compensatedSum } from "../sum.ts";

/**
 * Net present value `NPV = Σ CF_t / (1 + r)^t`, `t = 0…n` — `cashFlows[0]` is undiscounted
 * (year 0, today), as in numpy-financial `npv`.
 *
 * @example
 * npv({ cashFlows: [-40000, 5000, 8000, 12000, 30000], discountRate: 0.08 }); // 3065.22…
 */
export const npv = (input: {
  /** Cash flow per period, year 0 first (investment negative), finite. */
  cashFlows: ArrayLike<number>;
  /** Discount rate per period, fraction, > −1. */
  discountRate: number;
}): number => {
  const { cashFlows, discountRate } = input;
  if (!(discountRate > -1 && Number.isFinite(discountRate))) {
    throw new RangeError(`discountRate must be finite and > -1, got ${discountRate}`);
  }
  assertFinite("cashFlows", cashFlows);
  return compensatedSum(Array.from(cashFlows, (cf, t) => cf / (1 + discountRate) ** t));
};
