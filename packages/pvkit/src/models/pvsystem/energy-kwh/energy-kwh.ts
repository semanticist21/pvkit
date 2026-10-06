import { compensatedSum } from "../../../sum.ts";

/**
 * Energy from a regularly sampled power series: `Σ P·Δt / 1000`, kWh.
 * Neumaier-compensated sum, so a year of minute data matches an exactly rounded sum.
 * Values are integrated as given (negative night tare reduces energy). A NaN step (e.g.
 * Perez POA with dni = dhi = 0 at low sun, as in pvlib) makes the total NaN — unlike a
 * pandas `.sum()`, nothing is skipped. Map NaN to 0 first if that is the intent.
 *
 * @param input.power - Power per step, W (mean or instantaneous, one value per step).
 * @param input.stepHours - Step length, hours (> 0), e.g. `1/60` for minute data.
 * @example
 * energyKwh({ power: [0, 2000, 4000, 2000, 0], stepHours: 1 }); // 8
 */
export const energyKwh = ({
  power,
  stepHours,
}: {
  power: ArrayLike<number>;
  stepHours: number;
}): number => {
  if (!(stepHours > 0 && Number.isFinite(stepHours))) {
    throw new RangeError(`stepHours must be finite and > 0, got ${stepHours}`);
  }
  return (compensatedSum(power) * stepHours) / 1000;
};
