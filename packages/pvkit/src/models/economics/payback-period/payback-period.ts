import { assertFinite } from "../finite.ts";

/**
 * Payback period: years until cumulative cash flow reaches 0, interpolated linearly inside
 * the year it crosses (cash assumed to arrive evenly through the year). With `discountRate`
 * each `CF_t` is first discounted by `(1 + r)^t` (discounted payback).
 * Returns 0 when the cumulative flow turns positive without ever going negative (e.g.
 * `cashFlows[0] > 0`, or a fully subsidized year 0 followed by positive years), and
 * `Infinity` when the horizon never pays back. Throws `RangeError` on a non-finite flow.
 *
 * @example
 * paybackPeriod({ cashFlows: [-1000, 400, 400, 400] }); // 2.5
 */
export const paybackPeriod = (input: {
  /** Cash flow per year, year 0 first (investment negative), finite. */
  cashFlows: ArrayLike<number>;
  /** Discount rate per year, fraction, > −1. Default 0 (simple payback). */
  discountRate?: number;
}): number => {
  const { cashFlows, discountRate = 0 } = input;
  if (!(discountRate > -1 && Number.isFinite(discountRate))) {
    throw new RangeError(`discountRate must be finite and > -1, got ${discountRate}`);
  }
  assertFinite("cashFlows", cashFlows);
  let cum = 0; // ≤ 0 throughout: the loop returns once it would turn positive
  for (let t = 0; t < cashFlows.length; t++) {
    const cf = (cashFlows[t] as number) / (1 + discountRate) ** t;
    const next = cum + cf;
    if (cum < 0 ? next >= 0 : next > 0) return cum < 0 ? t - 1 + -cum / cf : 0;
    cum = next;
  }
  return Number.POSITIVE_INFINITY;
};
