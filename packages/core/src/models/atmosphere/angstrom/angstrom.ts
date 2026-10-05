/** Inputs for {@link angstromAodAtLambda}. Wavelengths in nm. */
export interface AngstromAodAtLambdaInput {
  /** Aerosol optical depth at `lambda0`, unitless. */
  aod0: number;
  /** Wavelength of `aod0`, nm. */
  lambda0: number;
  /** Angstrom exponent, unitless. Default 1.14. */
  alpha?: number;
  /** Target wavelength, nm. Default 700. */
  lambda1?: number;
}

/**
 * Aerosol optical depth at `lambda1` by the Angstrom law
 * `τ₁ = τ₀ · (λ₁/λ₀)^(−α)`. Unitless.
 *
 * @example
 * angstromAodAtLambda({ aod0: 0.1, lambda0: 500 }); // AOD at 700 nm ≈ 0.0681
 */
export const angstromAodAtLambda = (input: AngstromAodAtLambdaInput): number => {
  const { aod0, lambda0, alpha = 1.14, lambda1 = 700 } = input;
  return aod0 * (lambda1 / lambda0) ** -alpha;
};

/** Inputs for {@link angstromAlpha}. Wavelengths in nm. */
export interface AngstromAlphaInput {
  /** Aerosol optical depth at `lambda1`, unitless. */
  aod1: number;
  /** First wavelength, nm. */
  lambda1: number;
  /** Aerosol optical depth at `lambda2`, unitless. */
  aod2: number;
  /** Second wavelength, nm. */
  lambda2: number;
}

/**
 * Angstrom exponent from AOD at two wavelengths, `α = −ln(τ₁/τ₂) / ln(λ₁/λ₂)`.
 * Unitless; `±Infinity`/`NaN` when `lambda1 = lambda2`, as pvlib.
 *
 * @example
 * angstromAlpha({ aod1: 0.2, lambda1: 380, aod2: 0.1, lambda2: 500 }); // ≈ 2.526
 */
export const angstromAlpha = (input: AngstromAlphaInput): number => {
  const { aod1, lambda1, aod2, lambda2 } = input;
  return -Math.log(aod1 / aod2) / Math.log(lambda1 / lambda2);
};
