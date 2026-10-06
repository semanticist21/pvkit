# inverter-sandia — Sandia inverter model

## Principle

`ΔV = Vdc − Vdco`, `A = Pdco·(1 + C1·ΔV)`, `B = Pso·(1 + C2·ΔV)`, `C = C0·(1 + C3·ΔV)`;
`Pac = (Paco/(A − B) − C·(A − B))·(Pdc − B) + C·(Pdc − B)²`, then `min(Paco, Pac)`;
`Pdc < Pso` → `−|Pnt|` (night tare). `pnt` defaults to 0 because some `@pvkit/spec`
`CecInverter` rows lack it (pvlib would return NaN there; unit-tested, not a fixture).

## Reference

- **Spec:** D. L. King, S. Gonzalez, G. M. Galbraith, W. E. Boyson, "Performance Model for
  Grid-Connected Photovoltaic Inverters", Sandia report SAND2007-5036, 2007,
  https://doi.org/10.2172/920449.
- **Reference implementation:** `pvlib.inverter.sandia` @ pvlib 0.16.1.
- **Fixtures:** `inverter-sandia-fixtures.json` (150 cases: 30 CEC library inverters ×
  Pdc ∈ {0, Pso/2, Pso, random, 1.3·Pdco}, Vdc inside the MPPT window), `scripts/fixtures/diode.py`.
- **Tolerance:** `1e-14` relative. Observed max error: 0.
