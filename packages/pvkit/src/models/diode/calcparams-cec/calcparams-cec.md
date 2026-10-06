# calcparams-cec — CEC six-parameter model

## Principle

De Soto (`calcparams-desoto`) with the short-circuit temperature coefficient adjusted by
the CEC fit's sixth parameter: `αsc,eff = αsc · (1 − adjust/100)`. A `pvkit-js/spec`
`CecModule` row is a valid input as-is.

## Reference

- **Spec:** A. P. Dobos, "An Improved Coefficient Calculator for the California Energy
  Commission 6 Parameter Photovoltaic Module Model", *J. Sol. Energy Eng.* 134 (2012)
  021011, https://doi.org/10.1115/1.4005759; De Soto et al. 2006 (see calcparams-desoto).
- **Reference implementation:** `pvlib.pvsystem.calcparams_cec` @ pvlib 0.16.1.
- **Fixtures:** `calcparams-cec-fixtures.json` (120 cases: 15 CEC library modules × 8
  conditions), `scripts/fixtures/diode.py`.
- **Tolerance:** `1e-13` relative, as calcparams-desoto. Observed max 2.3e-16.
