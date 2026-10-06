# reindl — Reindl anisotropic sky diffuse (isotropic + circumsolar + horizon)

## Principle

`AI = dni/dniExtra`, `Rb = max(cos θ, 0)/max(cos z, 0.01745)`, `Hb = max(dni cos z, 0)`,
`SVF = (1 + cos β)/2`, `h = √(Hb/ghi) · sin³(β/2)`;
`poaSkyDiffuse = dhi · [(1 − AI)·SVF + AI·Rb + (1 − AI)·SVF·h]`.
Guard as pvlib: `Hb/ghi = 0` when `ghi = 0`. No floor on the result (negative dhi passes
through), matching pvlib.

## Reference

- **Spec:** D. T. Reindl, W. A. Beckman, J. A. Duffie, "Evaluation of hourly tilted surface
  radiation models", *Solar Energy* 45(1):9–17, 1990, doi:10.1016/0038-092X(90)90061-G.
- **Reference implementation:** `pvlib.irradiance.reindl` @ pvlib 0.16.1.
- **Fixtures:** `reindl-fixtures.json` — the shared transposition scenario set (see
  `../irradiance.md`).
- **Tolerance:** `1e-12` relative to `max(1, |expected|)` W/m². Observed max error: 2.5e-16 (relative; non-finite outcomes match exactly).
