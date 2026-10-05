# klucher — Klucher anisotropic sky diffuse

## Principle

`poaSkyDiffuse = dhi · ½(1 + cos β) · (1 + F sin³(β/2)) · (1 + F cos²θ sin³z)` with
`F = 1 − (dhi/ghi)²` and `cos θ = max(aoiProjection, 0)`. F → 1 under clear skies
(horizon and circumsolar brightening), F → 0 overcast (isotropic).

Guards as in pvlib: `F = 0` when `dhi/ghi` is NaN (dhi = ghi = 0). `ghi = 0` with `dhi ≠ 0`
gives `F = −∞` and the result is ±∞/NaN — pvlib does the same; such inputs are physically
inconsistent and the fixtures pin that behaviour.

## Reference

- **Spec:** T. M. Klucher, "Evaluation of models to predict insolation on tilted surfaces",
  *Solar Energy* 23(2):111–114, 1979, doi:10.1016/0038-092X(79)90110-5.
- **Reference implementation:** `pvlib.irradiance.klucher` @ pvlib 0.16.1.
- **Fixtures:** `klucher-fixtures.json` — the shared transposition scenario set (see
  `../irradiance.md`).
- **Tolerance:** `1e-12` relative to `max(1, |expected|)` W/m². Observed max error: 2.9e-16 (relative; non-finite outcomes match exactly).
