# bill-savings — self-consumption vs export (net billing)

## Principle

Per interval `i`: `s_i = min(P_i, L_i)` (self-consumed), `x_i = P_i − s_i` (exported),
`m_i = L_i − s_i` (still imported); returned as `selfConsumption`, `gridExport`,
`gridImport`. Savings versus no PV:
`Σ s_i·p_import,i + Σ x_i·p_export,i`. Prices are flat or one per interval (time-of-use).
Netting is instantaneous per interval (net billing);
monthly net metering with credit carry-over, demand charges and fixed fees are tariff
logic left to the caller. All sums Neumaier-compensated (8760 h × 25 yr friendly).
Guards: equal lengths; `P`, `L` finite ≥ 0; prices finite.

## Reference

- **Spec:** NREL SAM help, "Electricity Rates" → net billing (per-interval netting,
  exports valued at the sell rate), https://sam.nrel.gov/; self-consumption definitions per R. Luthander et al., "Photovoltaic self-consumption in
  buildings: A review", *Applied Energy* 142 (2015) 80–94,
  https://doi.org/10.1016/j.apenergy.2014.12.028.
- **Reference implementation:** explicit formula, numpy float64 + `math.fsum` (arithmetic);
  NREL SAM via PySAM 7.1.1.post1 (`scripts/fixtures/economics-sam.py`) `Utilityrate5` net
  billing (`ur_metering_option` 2) `savings_year1` (convention: per-hour netting, TOU).
- **Fixtures:** `bill-savings-fixtures.json` (60 cases: hand check, empty, no PV, no load,
  TOU, 55 random diurnal series with flat or TOU prices), `scripts/fixtures/economics.py`.
  `bill-savings-sam-fixtures.json` (6 cases, 8760 h from a 24-h profile, flat and TOU rates).
  Test adds a hand-derived TOU example.
- **Tolerance:** `1e-14` relative vs the formula (absolute where expected is 0; observed 0);
  `1e-12` vs SAM (observed 6.5e-15, different summation order).
