# cec-modules — CEC module list with single-diode parameters

`CEC_MODULES` is every row of the NREL SAM "CEC Modules" library: the California Energy
Commission's eligible-module list (datasheet STC ratings, NOCT, temperature coefficients)
plus the six CEC single-diode parameters SAM fits to each datasheet (De Soto et al. 2006 with
Dobos's `Adjust` term). Those six (`aRef`, `iLRef`, `iORef`, `rS`, `rShRef`, `adjust`) with
`alphaSc` are exactly the inputs of `calcparams_cec`.

Values are as listed, except `gammaPmp`, converted %/°C → 1/°C so it plugs into core's
`pvwattsDc` `gammaPdc`. Blank cells (`length`, `width` on older rows; one `cellsInSeries`) are
omitted. Source quirks are kept, not curated: 36 names repeat, technology spelling varies
("Mono-C-si"), and 5 rows list `imp ≥ isc`.

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
  CSV independently; `cec-modules-fixtures.json` pins 60 rows (first, last, blank-cell rows,
  random).
- **Tolerance:** exact for values parsed from the same decimal text; `1e-15` relative for
  `gammaPmp` (one division).
