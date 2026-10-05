# generic-linear — generic linear heat-loss module temperature

## Principle

`Tm = Ta + E·(α − η) / (u_const + du_wind·WS)` (Driesse et al. 2022). The heat input is
absorbed irradiance minus electrical output; the loss coefficient is linear in 10 m wind.
Faiman, PVsyst, SAM NOCT and SAPM-module are all special cases or linearisations of it —
their parameters convert in `generic-linear-model`. No defaults (pvlib has none); no
guards, NaN/∞ propagate as in pvlib.

## Reference

- **Spec:** A. Driesse et al., "PV Module Operating Temperature Model Equivalence and
  Parameter Translation", 2022 IEEE 49th Photovoltaic Specialists Conference (PVSC).
- **Reference implementation:** `pvlib.temperature.generic_linear` @ pvlib 0.16.1.
- **Fixtures:** `generic-linear-fixtures.json` (86 cases: 6 edge conditions incl. 0 / −5
  W/m², calm, 30 m/s, −40/50 °C with the pvlib example parameters; 80 random), generated
  by `scripts/fixtures/temperature-generic-linear.py`.
- **Tolerance:** `1e-12` °C. Observed max error 0 (bit-identical on V8). Pure arithmetic in float64.
