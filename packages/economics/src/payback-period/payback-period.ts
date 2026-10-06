/**
 * Payback period: years until cumulative cash flow reaches 0, interpolated linearly inside
 * the year it crosses (cash assumed to arrive evenly through the year). With `discountRate`
 * each `CF_t` is first discounted by `(1 + r)^t` (discounted payback).
 * Returns 0 when `cashFlows[0] ≥ 0` and `Infinity` when the horizon never pays back.
 *
 * @example
 * paybackPeriod({ cashFlows: [-1000, 400, 400, 400] }); // 2.5
 */
export const paybackPeriod = (input: {
  /** Cash flow per year, year 0 first (investment negative). */
  cashFlows: ArrayLike<number>;
  /** Discount rate per year, fraction, > −1. Default 0 (simple payback). */
  discountRate?: number;
}): number => {
  const { cashFlows, discountRate = 0 } = input;
  if (!(discountRate > -1 && Number.isFinite(discountRate))) {
    throw new RangeError(`discountRate must be finite and > -1, got ${discountRate}`);
  }
  let cum = 0;
  for (let t = 0; t < cashFlows.length; t++) {
    const cf = (cashFlows[t] as number) / (1 + discountRate) ** t;
    const next = cum + cf;
    if (next >= 0) return t === 0 ? 0 : t - 1 + -cum / cf;
    cum = next;
  }
  return Number.POSITIVE_INFINITY;
};
