# voltage-at-temperature — module voltage corrected to a cell temperature

Linear temperature correction of a module voltage with the manufacturer's coefficient:

`V(T) = V_ref + β·(T − T_ref)`, with `β` in V/°C (CEC `betaOc`; datasheet %/°C × V / 100).

NEC 690.7(A)(1) requires the string's maximum voltage from `voc` at the lowest expected
ambient temperature (cells sit at ambient at a cold, clear dawn). The same formula with `vmp`
at the hottest expected cell temperature gives the low end of the MPP voltage used for
`stringSize`'s `vmpMin`. A `vmp` coefficient is rarely published; `betaOc` is the usual
stand-in (Sandia SAPM has `bvmpo`).

## Reference

- **Spec:** NFPA 70, National Electrical Code 2023, §690.7(A)(1) (manufacturer's
  temperature coefficient method),
  https://www.nfpa.org/codes-and-standards/nfpa-70-standard-development/70; linear
  coefficient per IEC 61215 / module datasheets.
- **Reference implementation:** the explicit formula in Python float64.
- **Worked examples (fixture `source` cases, reproduced by the generator):** Mike Holt,
  Illustrated Guide to the 2011 NEC Requirements for Solar PV Systems §690.7 (sample at
  https://www.mikeholt.com/instructor2/img/product/pdf/1295899800-sample.pdf): 22.60 V,
  −0.075 V/°C, −7 °C → 25.0 V; Penn State AE 868 "Voltage design"
  (https://courses.ems.psu.edu/ae868/node/943): 38 V, 60 × −0.0032 V/°C, −23 °C → 47.2 V.
- **Fixtures:** `voltage-at-temperature-fixtures.json` (52 cases: the 2 worked examples,
  −40 … 85 °C, β = 0, `tempRef` 20 and 25 °C, zero voltage, 44 random), from
  `scripts/fixtures/sizer.py`.
- **Tolerance:** `1e-14` relative to `max(1, |V|)`; only `+ − ×`, exact up to fused
  multiply-add differences.
