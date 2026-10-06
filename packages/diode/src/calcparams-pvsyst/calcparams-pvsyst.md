# calcparams-pvsyst — PVsyst single-diode parameters

## Principle

- `γ = γref + μγ·(Tc − Tref)` (ideality factor), `nNsVth = γ·k/q·Ns·Tc`
- `IL = S/Sref · (IL,ref + αsc·(Tc − Tref))`
- `I0 = I0,ref · (Tc/Tref)³ · exp(q·Eg,ref/(k·γ) · (1/Tref − 1/Tc))`
- `Rsh = Rsh,base + (Rsh,0 − Rsh,base)·exp(−Rexp·S/Sref)`,
  `Rsh,base = max(0, (Rsh,ref − Rsh,0·e^(−Rexp)) / (1 − e^(−Rexp)))`, `Rexp` default 5.5

`k`, `q` exact SI. Temperatures in K inside the exponentials.

## Reference

- **Spec:** K. J. Sauer, T. Roessler, C. W. Hansen, "Modeling the Irradiance and Temperature
  Dependence of Photovoltaic Modules in PVsyst", *IEEE J. Photovoltaics* 5 (2015) 152–158,
  https://doi.org/10.1109/JPHOTOV.2014.2364133; A. Mermoud, T. Lejeune, "Performance
  assessment of a simulation model for PV modules of any available technology", 25th EU
  PVSEC, 2010.
- **Reference implementation:** `pvlib.pvsystem.calcparams_pvsyst` @ pvlib 0.16.1.
- **Fixtures:** `calcparams-pvsyst-fixtures.json` (60 random parameter sets, S = 0 included,
  −30…85 °C), `scripts/fixtures/diode.py`.
- **Tolerance:** `1e-13` relative. Observed max 2.0e-16.
