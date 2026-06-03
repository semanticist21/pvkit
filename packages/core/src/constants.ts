/**
 * Shared physical constants — universal physics only, no model-specific coefficients.
 *
 * Rule: a constant lives here only if 2+ models use the same value AND it is a
 * universal physical quantity (no module-name prefix needed). Model-specific
 * coefficients (Perez, SAPM, Linke turbidity, SPA tables) stay inside their own
 * `models/<module>/constants.ts`, never here.
 *
 * Each value must cite its source — papers may differ (e.g. solar constant
 * 1361 vs 1367 W/m²); pin one with provenance.
 *
 * TODO: fill in as models need them. Candidates:
 *   GSC   solar constant        ~1361 W/m²   (Gueymard 2018)
 *   AU    astronomical unit      1.495978707e11 m
 *   SIGMA Stefan-Boltzmann       5.670374e-8 W/m²K⁴
 *   P0    standard pressure      101325 Pa
 *   T0    0 °C in kelvin         273.15 K
 */

export {};
