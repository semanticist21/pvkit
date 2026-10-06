/**
 * Annual project cash flows, year 0 … n, for `npv` / `irr` / `paybackPeriod` / `roi`:
 * `CF_0 = −capitalCost + incentive`,
 * `CF_t = E_t · p · (1 + e_p)^(t−1) − c_om · (1 + e_om)^(t−1)`, `t = 1…n`.
 * Pre-tax, no financing; edit the returned array for replacements (inverter), taxes or
 * loan payments.
 *
 * @example
 * cashFlows({ capitalCost: 10000, energy: [5000, 4975], energyPrice: 0.2 }); // [-10000, 1000, 995]
 */
export const cashFlows = (input: {
  /** Up-front installed cost (currency), ≥ 0. */
  capitalCost: number;
  /** Energy valued per year, kWh, years 1…n (e.g. `lifetimeEnergy(...).annual`). */
  energy: ArrayLike<number>;
  /** Year-1 value per kWh (currency/kWh) — e.g. `billSavings(...).savings / ΣP`. */
  energyPrice: number;
  /** Annual escalation of `energyPrice`, fraction per year. Default 0. */
  priceEscalation?: number;
  /** Up-front incentive received at year 0 (currency): rebate, tax credit. Default 0. */
  incentive?: number;
  /** Year-1 operation & maintenance cost (currency). Default 0. */
  omCost?: number;
  /** Annual escalation of `omCost`, fraction per year. Default 0. */
  omEscalation?: number;
}): number[] => {
  const {
    capitalCost,
    energy,
    energyPrice,
    priceEscalation = 0,
    incentive = 0,
    omCost = 0,
    omEscalation = 0,
  } = input;
  for (const [name, v] of Object.entries({ capitalCost, energyPrice, incentive, omCost })) {
    if (!Number.isFinite(v)) throw new RangeError(`${name} must be finite, got ${v}`);
  }
  for (const [name, v] of Object.entries({ priceEscalation, omEscalation })) {
    if (!(v > -1 && Number.isFinite(v))) {
      throw new RangeError(`${name} must be finite and > -1, got ${v}`);
    }
  }
  const out = [incentive - capitalCost];
  for (let t = 0; t < energy.length; t++) {
    out.push(
      (energy[t] as number) * energyPrice * (1 + priceEscalation) ** t -
        omCost * (1 + omEscalation) ** t,
    );
  }
  return out;
};
