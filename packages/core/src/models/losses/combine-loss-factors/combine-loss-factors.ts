/**
 * Compound independent loss fractions: `L = 1 − Π(1 − Lᵢ)` (pvlib
 * `pvsystem.combine_loss_factors`, scalar). Empty input → 0. Negative fractions act as gains.
 *
 * @param input.losses - Loss fractions (0–1, unitless), one per independent derate.
 * @example
 * combineLossFactors({ losses: [0.02, 0.03] }); // 0.0494
 */
export const combineLossFactors = ({ losses }: { losses: ArrayLike<number> }): number => {
  let factor = 1;
  for (let i = 0; i < losses.length; i++) factor *= 1 - (losses[i] as number);
  return 1 - factor;
};
