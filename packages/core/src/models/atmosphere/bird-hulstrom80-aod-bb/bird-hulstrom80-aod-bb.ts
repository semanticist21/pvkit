/** Inputs for {@link birdHulstrom80AodBb}. */
export interface BirdHulstrom80AodBbInput {
  /** Aerosol optical depth at 380 nm, unitless. */
  aod380: number;
  /** Aerosol optical depth at 500 nm, unitless. */
  aod500: number;
}

/**
 * Broadband aerosol optical depth from AOD at 380 and 500 nm (Bird & Hulstrom 1980):
 * `τ_bb = 0.27583·τ₃₈₀ + 0.35·τ₅₀₀`. Unitless.
 *
 * @example
 * birdHulstrom80AodBb({ aod380: 0.15, aod500: 0.1 }); // ≈ 0.0764
 */
export const birdHulstrom80AodBb = (input: BirdHulstrom80AodBbInput): number =>
  0.27583 * input.aod380 + 0.35 * input.aod500;
