# inverter-adr — ADR inverter efficiency model

## Principle

`p = Pdc/Pnom`, `v = Vdc/Vnom`; loss
`ploss = Σ b_k·φ_k`, `φ = [1, p, p², v−1, p(v−1), p²(v−1), 1/v−1, p(1/v−1), p²(1/v−1)]`;
`Pac = Pnom·(p − ploss)`, limited to `[−|Pnt|, Pacmax]`. `Vdc = 0` → `−|Pnt|`; Vdc outside
`[max(Vmin, MPPTLow)·(1 − vtol), max(Vmax, Vdcmax, MPPTHi)·(1 + vtol)]` → NaN (`vtol` 0.1,
NaN limits ignored as `np.nanmax`; all NaN → that bound is not applied). Coefficients come with the SAM ADR library (not yet in
`@pvkit/spec`); field names are pvlib's, camelCased.

## Reference

- **Spec:** A. Driesse, P. Jain, S. Harrison, "Beyond the Curves: Modeling the Electrical
  Efficiency of Photovoltaic Inverters", 33rd IEEE PVSC, 2008,
  https://doi.org/10.1109/PVSC.2008.4922827.
- **Reference implementation:** `pvlib.inverter.adr` @ pvlib 0.16.1.
- **Fixtures:** `inverter-adr-fixtures.json` (154 cases: 30 rows of pvlib's
  `adr-library-cec-inverters-2019-03-05.csv` × nominal, Vdc = 0, Pdc = 0, over-voltage
  (NaN), random point; plus MPPT-only-NaN and all-NaN limits at nominal and over-voltage), `scripts/fixtures/diode.py`.
- **Tolerance:** `1e-14` relative. Observed max error: 0.
