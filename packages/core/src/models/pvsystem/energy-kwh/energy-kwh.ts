import { compensatedSum } from "../../../sum.ts";

/**
 * Energy from a regularly sampled power series: `Σ P·Δt / 1000`, kWh.
 * Neumaier-compensated sum, so a year of minute data matches an exactly rounded sum.
 * Values are integrated as given (negative night tare reduces energy).
 *
 * @param powerW - Power per step, W (mean or instantaneous, one value per step).
 * @param stepHours - Step length, hours (> 0), e.g. `1/60` for minute data.
 * @example
 * energyKwh([0, 2000, 4000, 2000, 0], 1); // 8
 */
export const energyKwh = (powerW: ArrayLike<number>, stepHours: number): number => {
  if (!(stepHours > 0 && Number.isFinite(stepHours))) {
    throw new RangeError(`stepHours must be finite and > 0, got ${stepHours}`);
  }
  return (compensatedSum(powerW) * stepHours) / 1000;
};
