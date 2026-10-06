# sandia-modules — Sandia Array Performance Model (SAPM) module database

`SANDIA_MODULES` is every row of the NREL SAM "Sandia Modules" library: outdoor-measured SAPM
coefficients (King et al. 2004) for 523 modules, 1994–2014 vintages. `a0`–`a4` are the
air-mass modifier, `b0`–`b5` the incidence-angle modifier (core `iam/sapm`), `a`, `b`,
`tempDelta` the module/cell temperature model (core `temperature/sapm`; SAM's `dT`, renamed
because `deltaT` means TT − UT across pvkit), the rest the SAPM I-V point equations.

Values are as listed; `c4`–`c7`, `ixo`, `ixxo` are blank for 10 rows and omitted there.

## Reference

- **Spec:** D. L. King, W. E. Boyson, J. A. Kratochvil, "Photovoltaic Array Performance
  Model", SAND2004-3535, Sandia National Laboratories, 2004, doi:10.2172/919131.
- **Data:** NREL SAM release `2026.7.3.r0.ssc.308`, `deploy/libraries/Sandia Modules.csv`
  (BSD-3-Clause; database updated by Sandia 2012), parsed by
  `scripts/fixtures/spec-sam-libraries.py` into `sandia-modules-data.json`.
- **Reference implementation:** `pvlib.pvsystem.retrieve_sam` @ pvlib 0.16.1 parses the same
  CSV independently; `sandia-modules-fixtures.json` pins 51 rows (first, last, blank-cell
  rows, random).
- **Tolerance:** exact (same decimal text parsed twice).
