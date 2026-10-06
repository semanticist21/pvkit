# sapm — Sandia Array Performance Model I-V points

## Principle

With `Ee = E/Eref`, `δ = n·k·(Tc + 273.15)/q`, `ΔT = Tc − Tref`, `β(Ee) = β + mβ·(1 − Ee)`:

- `Isc = Isco·Ee·(1 + αIsc·ΔT)`, `Imp = Impo·(C0·Ee + C1·Ee²)·(1 + αImp·ΔT)`
- `Voc = max(0, Voco + Ns·δ·ln Ee + βVoc(Ee)·ΔT)`
- `Vmp = max(0, Vmpo + C2·Ns·δ·ln Ee + C3·Ns·(δ·ln Ee)² + βVmp(Ee)·ΔT)`, `Pmp = Imp·Vmp`
- `Ix = Ixo·(C4·Ee + C5·Ee²)·(1 + αIsc·ΔT)`, `Ixx = Ixxo·(C6·Ee + C7·Ee²)·(1 + αImp·ΔT)` —
  only when the module has those coefficients (pvlib behaviour).

`Ee = 0` → `ln Ee = −∞`; `Ee < 0` → NaN. A `@pvkit/spec` `SandiaModule` row is a valid input.

## Reference

- **Spec:** D. L. King, W. E. Boyson, J. A. Kratochvil, "Photovoltaic Array Performance
  Model", Sandia report SAND2004-3535, 2004, https://doi.org/10.2172/919131.
- **Reference implementation:** `pvlib.pvsystem.sapm` @ pvlib 0.16.1.
- **Fixtures:** `sapm-fixtures.json` (60 cases: 15 Sandia library modules × 4 conditions incl.
  Ee = 0 and 1 W/m²), `scripts/fixtures/diode.py`.
- **Tolerance:** `1e-14` relative. Observed max error: 0.
