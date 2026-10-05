/**
 * Losses — optional derate models.
 *
 * - `soiling-kimber`: Kimber et al. 2006 soiling loss, one step with explicit prior state.
 * - `soiling-hsu`: Coello & Boyle 2019 (HSU) soiling ratio, one step with explicit prior mass.
 * - `combine-loss-factors`: compound loss fractions, 1 − Π(1 − Lᵢ).
 *
 * Snow (Marion) is 1.0-optional and not implemented.
 */

export * from "./combine-loss-factors/index.ts";
export * from "./soiling-hsu/index.ts";
export * from "./soiling-kimber/index.ts";
