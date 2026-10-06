# sapm-effective-irradiance — irradiance the cells convert

## Principle

`Ee = F1·(Eb·F2 + fd·Ed)`: beam POA scaled by the AOI modifier `F2` (core `iam/sapm`),
diffuse POA by the module's diffuse fraction `fd`, both by the spectral factor `F1`
(`sapmSpectralFactor`). `F1`/`F2` are inputs so this package never calls core.

## Reference

- **Spec:** King, Boyson & Kratochvil 2004, SAND2004-3535 (see sapm).
- **Reference implementation:** `pvlib.pvsystem.sapm_effective_irradiance` @ pvlib 0.16.1
  (its F1/F2 passed in as inputs).
- **Fixtures:** `sapm-effective-irradiance-fixtures.json` (60 cases: 15 Sandia modules × 4
  random sky/sun states), `scripts/fixtures/diode.py`.
- **Tolerance:** `1e-14` relative. Observed max error: 0.
