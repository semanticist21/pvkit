/**
 * Losses (optional derate models).
 *
 * Spec: Kimber (soiling), HSU (Coello & Boyle 2019, soiling), Marion NREL (snow).
 * Scope: pure-compute, paper-backed derate models. snow is 1.0-optional
 * (geographically niche). combine_loss_factors is the join point for derates.
 * Validation: pin reference outputs as fixtures and assert against them.
 *
 * TODO: soiling.kimber → soiling.hsu → combine_loss_factors → snow (optional).
 */

export {};
