import { compensatedSum } from "../sum.ts";

/**
 * Year-by-year energy over a system's life with compound annual degradation:
 * `E_t = E_1 · (1 − d)^(t−1)`, `t = 1…years`, and the lifetime total `ΣE_t`.
 *
 * @example
 * lifetimeEnergy({ firstYearEnergy: 1000, degradationRate: 0.005, years: 2 });
 * // { annual: [1000, 995], total: 1995 }
 */
export const lifetimeEnergy = (input: {
  /** Year-1 energy, kWh (e.g. a core `energyKwh` total for a typical year). */
  firstYearEnergy: number;
  /** Annual degradation, fraction per year, < 1 (0.005 = 0.5 %/yr; negative = gain). */
  degradationRate: number;
  /** System life, whole years ≥ 0. */
  years: number;
}): { annual: number[]; total: number } => {
  const { firstYearEnergy, degradationRate, years } = input;
  if (!Number.isFinite(firstYearEnergy)) {
    throw new RangeError(`firstYearEnergy must be finite, got ${firstYearEnergy}`);
  }
  if (!(degradationRate < 1 && Number.isFinite(degradationRate))) {
    throw new RangeError(`degradationRate must be finite and < 1, got ${degradationRate}`);
  }
  if (!(Number.isInteger(years) && years >= 0)) {
    throw new RangeError(`years must be a whole number ≥ 0, got ${years}`);
  }
  const annual = Array.from(
    { length: years },
    (_, t) => firstYearEnergy * (1 - degradationRate) ** t,
  );
  return { annual, total: compensatedSum(annual) };
};
