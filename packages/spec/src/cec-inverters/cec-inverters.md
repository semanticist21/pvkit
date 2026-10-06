# cec-inverters — CEC inverter list with Sandia inverter-model parameters

`CEC_INVERTERS` is every row of the NREL SAM "CEC Inverters" library: the California Energy
Commission's eligible-inverter list with the Sandia grid-connected inverter model parameters
(`paco`, `pdco`, `vdco`, `pso`, `c0`–`c3`, `pnt`) fit to each CEC efficiency test, and the
DC limits a string sizer checks against (`vdcMax`, `idcMax`, `mpptLow`, `mpptHigh`).

Values are as listed. `pnt` is `nan` in the source for some rows and is omitted there. Every
row satisfies `mpptLow ≤ mpptHigh ≤ vdcMax` and `pdco > paco` (asserted).

## Reference

- **Spec:** D. L. King, S. Gonzalez, G. M. Galbraith, W. E. Boyson, "Performance Model for
  Grid-Connected Photovoltaic Inverters", SAND2007-5036, Sandia National Laboratories, 2007,
  doi:10.2172/920449.
- **Data:** NREL SAM release `2026.7.3.r0.ssc.308`, `deploy/libraries/CEC Inverters.csv`
  (BSD-3-Clause), parsed by `scripts/fixtures/spec-sam-libraries.py` into
  `cec-inverters-data.json`.
- **Reference implementation:** `pvlib.pvsystem.retrieve_sam` @ pvlib 0.16.1 parses the same
  CSV independently; `cec-inverters-fixtures.json` pins the first and last rows, 40
  random rows, and the first row of each blank-cell pattern.
- **Tolerance:** exact (pandas parses every cell of this table to the correctly rounded value).
