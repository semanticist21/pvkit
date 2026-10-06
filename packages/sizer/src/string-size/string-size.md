# string-size — series and parallel limits on one inverter input

- `maxSeries = ⌊vdcMax / vocMax⌋` — the NEC 690.7 maximum system voltage (cold `voc` × modules)
  must not exceed the inverter's maximum DC input voltage. This is the safety limit only when
  `vdcMax` is the datasheet maximum input voltage.
- `minSeries = max(1, ⌈mpptLow / vmpMin⌉)` — on the hottest day the string MPP voltage must
  stay inside the MPPT window, or the inverter loses tracking / drops out.
- `maxParallel = ⌊idcMax / imp⌋` — strings whose summed MPP current fits the inverter's
  maximum DC input current; current above it is clipped, not a hazard.

`minSeries > maxSeries` means no string length works for that module/inverter pair. Field
names match `@pvkit/spec` (`CecInverter`, `CecModule`), but a CEC record's `vdcMax` and
`mpptLow` are the rated MPPT window (`vdcMax` = `mpptHigh` in every CEC row), not the
absolute input range: spreading one in gives a conservative `maxSeries`. Pass the datasheet
maximum input voltage as `vdcMax` for the NEC 690.7 limit. Not covered: cold-day Vmp above
`mpptHigh` (a yield, not safety, check), conductor/OCPD sizing (NEC 690.8–690.9).

## Reference

- **Spec:** NFPA 70, National Electrical Code 2023, §690.7(A) (maximum voltage),
  https://www.nfpa.org/codes-and-standards/nfpa-70-standard-development/70, and the
  inverter's listed DC input ratings; MPPT window per King et al., SAND2007-5036 (Sandia
  inverter model `Mppt_low`/`Vdcmax`/`Idcmax`), https://doi.org/10.2172/920449.
- **Reference implementation:** the explicit formulas in Python float64 (`math.floor`/`ceil`).
  The fixtures prove JS/Python agreement and edge handling only; no free published worked
  example with inverter limits was found, so none is pinned (the string voltages it divides
  are anchored in voltage-at-temperature and nec-voltage-correction).
- **Fixtures:** `string-size-fixtures.json` (50 cases: exact quotients, an infeasible pair,
  `mpptLow` = 0, 46 random), from `scripts/fixtures/sizer.py`.
- **Tolerance:** exact — each result is one IEEE division then floor/ceil, identical in
  Python and JS.
