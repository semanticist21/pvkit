# roi — simple return on investment

## Principle

`ROI = Σ_{t=0…n} CF_t / (−CF_0)`: net undiscounted gain over the horizon per unit
invested (0.2 = +20 %). For time value use `npv` / `irr`. Guard: `CF_0 < 0`.

## Reference

- **Spec:** Short, Packey & Holt 1995, NREL/TP-462-5173 (net savings over investment;
  undiscounted form).
- **Reference implementation:** explicit formula, Python `math.fsum`.
- **Fixtures:** `roi-fixtures.json` (60 cases), `scripts/fixtures/economics.py`.
- **Tolerance:** `1e-14` relative (absolute where expected is 0). Observed max error: 0.
