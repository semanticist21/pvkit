import { compensatedSum } from "../sum.ts";

/**
 * Levelized cost of energy `LCOE = Σ C_t/(1 + r)^t ÷ Σ E_t/(1 + r)^t`, `t = 0…n`
 * (Short, Packey & Holt 1995). Both series start at year 0 (usually `costs[0]` = installed
 * cost, `energy[0]` = 0). Result is currency per kWh. Pre-tax: fold taxes, incentives and
 * financing into `costs` if wanted.
 *
 * @example
 * lcoe({ costs: [1000, 10, 10], energy: [0, 1000, 1000], discountRate: 0 }); // 0.51
 */
export const lcoe = (input: {
  /** Cost per year (currency), year 0 first. */
  costs: ArrayLike<number>;
  /** Energy per year, kWh, year 0 first; same length as `costs`. */
  energy: ArrayLike<number>;
  /** Discount rate per year, fraction, > −1 (real or nominal — match your costs). */
  discountRate: number;
}): number => {
  const { costs, energy, discountRate } = input;
  if (!(discountRate > -1 && Number.isFinite(discountRate))) {
    throw new RangeError(`discountRate must be finite and > -1, got ${discountRate}`);
  }
  if (costs.length !== energy.length) {
    throw new RangeError(`costs has ${costs.length} values, energy has ${energy.length}`);
  }
  const pv = (xs: ArrayLike<number>) =>
    compensatedSum(Array.from(xs, (x, t) => x / (1 + discountRate) ** t));
  return pv(costs) / pv(energy);
};
