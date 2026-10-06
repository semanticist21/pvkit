# cec-modules — CEC module list with single-diode parameters

`CEC_MODULES` is every row of the NREL SAM "CEC Modules" library: the California Energy
Commission's eligible-module list (datasheet STC ratings, NOCT, temperature coefficients)
plus the six CEC single-diode parameters SAM fits to each datasheet (De Soto et al. 2006 with
Dobos's `Adjust` term). Those six (`aRef`, `iLRef`, `iORef`, `rS`, `rShRef`, `adjust`) with
`alphaSc` are exactly the inputs of `calcparams_cec`.

Values are as listed, except `gammaPmp`, converted %/°C → 1/°C so it plugs into pvkit's
`pvwattsDc` `gammaPdc`. Blank cells (`length`, `width` on older rows; one `cellsInSeries`) are
omitted. Source quirks are kept, not curated: some names repeat, technology spelling varies
("Mono-C-si"), a few rows list `imp ≥ isc`, and a few list `alphaSc` at ≈ 46 % of `isc` per °C
(a unit error in the source, ~100× too large for `calcparams_cec`; count pinned in the test).

## Reference

- **Spec:** W. De Soto, S. A. Klein, W. A. Beckman, "Improvement and validation of a model
  for photovoltaic array performance", Solar Energy 80(1), 2006,
  doi:10.1016/j.solener.2005.06.010; A. P. Dobos, "An Improved Coefficient Calculator for the
  California Energy Commission 6 Parameter Photovoltaic Module Model", J. Sol. Energy Eng.
  134(2), 2012, doi:10.1115/1.4005759.
- **Data:** NREL SAM release `2026.7.3.r0.ssc.308`, `deploy/libraries/CEC Modules.csv`
  (BSD-3-Clause), parsed by `scripts/fixtures/spec-sam-libraries.py` into
  `cec-modules-data.json`.
- **Reference implementation:** `pvlib.pvsystem.retrieve_sam` @ pvlib 0.16.1 parses the same
  CSV independently; `cec-modules-fixtures.json` pins the first and last rows, 40 random
  rows, the first row of each blank-cell pattern, and the row where pvlib's parse strays
  furthest from the CSV text.
- **Tolerance:** `1e-14` relative. pvkit's values are the correctly rounded parse of the CSV
  text; `retrieve_sam` reads it with pandas' default C float parser, which is not correctly
  rounded and is off by up to 9.2e-15 relative over the full table (e.g. `0.010721399999999999`
  → `0.0107213999999999`). The pinned worst row fails at `1e-15`.
