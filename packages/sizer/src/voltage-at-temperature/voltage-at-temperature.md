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
  temperature coefficient method); linear coefficient per IEC 61215 / module datasheets.
- **Reference implementation:** the explicit formula in Python float64 — no library
  implements string sizing (pvlib, SAM's sizing helper is UI code).
- **Fixtures:** `voltage-at-temperature-fixtures.json` (50 cases: −40 … 85 °C, β = 0,
  `tempRef` 20 and 25 °C, zero voltage, 44 random), from `scripts/fixtures/sizer.py`.
- **Tolerance:** `1e-14` relative to `max(1, |V|)`; only `+ − ×`, exact up to fused
  multiply-add differences.
