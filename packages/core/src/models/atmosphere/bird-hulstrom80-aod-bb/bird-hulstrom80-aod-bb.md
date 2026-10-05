# bird-hulstrom80-aod-bb — broadband aerosol optical depth

## Principle

`τbb = 0.27583·τ380 + 0.35·τ500` — broadband AOD from AOD at 380 nm and 500 nm. Unitless.
No guards (pvlib has none).

## Reference

- **Spec:** R. E. Bird, R. L. Hulstrom, "Direct insolation models", SERI/TR-335-344,
  1980, https://www.nrel.gov/docs/legosti/old/344.pdf; and "A simplified clear sky model
  for direct and diffuse insolation on horizontal surfaces", SERI/TR-642-761, 1981,
  https://www.nrel.gov/docs/legosti/old/761.pdf.
- **Reference implementation:** `pvlib.atmosphere.bird_hulstrom80_aod_bb(aod380,
  aod500)` @ pvlib 0.16.1.
- **Fixtures:** `bird-hulstrom80-aod-bb-fixtures.json` (50 cases: zero, small, large AOD,
  46 random τ380 0–2 × τ500 0–1.5), from `scripts/fixtures/atmosphere-bird-hulstrom80-aod-bb.py`.
- **Tolerance:** `1e-15` absolute (result ≤ ~1.1, 1 ULP ≈ 2e-16). Observed max 0
  (bit-identical). Same two multiplies and one add.
