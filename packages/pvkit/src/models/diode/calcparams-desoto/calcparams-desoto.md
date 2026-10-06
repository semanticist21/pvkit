# calcparams-desoto — De Soto five-parameter model

## Principle

Translates the reference-condition single-diode fit to an operating point
(`Tc`, `Tref` in K):

- `IL = S/Sref · (IL,ref + αsc·(Tc − Tref))`
- `Eg = Eg,ref · (1 + dEgdT·(Tc − Tref))`
- `I0 = I0,ref · (Tc/Tref)³ · exp(Eg,ref/(k·Tref) − Eg/(k·Tc))`
- `Rsh = Rsh,ref · Sref/S` (`S = 0` → `Infinity`), `Rs` constant, `nNsVth = aref · Tc/Tref`

`k` = exact SI `k/e` in eV/K. Defaults `Eg,ref = 1.121 eV` and `dEgdT = −0.0002677 1/K`
(c-Si) are the values used to fit the CEC library. Output feeds `singleDiode`.

## Reference

- **Spec:** W. De Soto, S. A. Klein, W. A. Beckman, "Improvement and validation of a model
  for photovoltaic array performance", *Solar Energy* 80 (2006) 78–88,
  https://doi.org/10.1016/j.solener.2005.06.010.
- **Reference implementation:** `pvlib.pvsystem.calcparams_desoto` @ pvlib 0.16.1.
- **Fixtures:** `calcparams-desoto-fixtures.json` (121 cases: 15 random CEC library modules ×
  8 conditions incl. S = 0, 1 W/m², −30…85 °C; one non-default band gap / reference), `scripts/fixtures/diode.py`.
- **Tolerance:** `1e-13` relative. Observed max 2.3e-16; `I0` has an `exp` of an argument
  ≈ 45, so ULP-level `exp` differences across engines scale by up to ~45.
