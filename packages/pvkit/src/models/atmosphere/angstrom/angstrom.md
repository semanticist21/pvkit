# angstrom — Angstrom turbidity law helpers

`angstromAodAtLambda` and `angstromAlpha`. Wavelengths in nm (any consistent unit works:
only ratios enter).

## Principle

Angstrom law `τ(λ) = β·λ^(−α)`:

- `angstromAodAtLambda`: `τ₁ = τ₀ · (λ₁/λ₀)^(−α)`; defaults `α = 1.14`, `λ₁ = 700 nm`
  (pvlib defaults).
- `angstromAlpha`: `α = −ln(τ₁/τ₂) / ln(λ₁/λ₂)`.

Guards: none, as pvlib — `λ₁ = λ₂` gives `±Infinity`/`NaN`; non-positive AOD gives
`NaN`/`±Infinity` from `ln`.

## Reference

- **Spec:** A. Ångström, "On the atmospheric transmission of sun radiation and on dust in
  the air", *Geogr. Ann.* 11:156–166, 1929, doi:10.1080/20014422.1929.11880498; α = 1.14
  default after Gueymard (in Polo et al., *Solar Resources Mapping*, Springer 2019,
  doi:10.1007/978-3-319-97484-2_5).
- **Reference implementation:** `pvlib.atmosphere.angstrom_aod_at_lambda(aod0, lambda0,
  alpha, lambda1)` and `pvlib.atmosphere.angstrom_alpha(aod1, lambda1, aod2, lambda2)` @
  pvlib 0.16.1, every argument passed explicitly.
- **Fixtures:** `angstrom-fixtures.json` — `angstromAodAtLambda` 50 cases (zero AOD,
  α = 0, negative α, λ₁ = λ₀, 340–1640 nm, 44 random) and `angstromAlpha` 50 cases (equal
  AODs → 0, steep/inverted spectra, 46 random), from `scripts/fixtures/atmosphere-angstrom.py`.
  The round trip `angstromAlpha ∘ angstromAodAtLambda = α` is also asserted.
- **Tolerance:** `1e-12` absolute (AOD ≤ ~10, α ≤ ~3). Observed max 0 (aod-at-lambda), 4.4e-16 (alpha). Same
  closed forms; `**`/`log` 1-ULP differences only.
