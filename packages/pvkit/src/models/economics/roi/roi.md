# roi — simple return on investment

## Principle

`ROI = Σ_{t=0…n} CF_t / (−CF_0)`: net undiscounted gain over the horizon per unit
invested (0.2 = +20 %). For time value use `npv` / `irr`. Guards: `CF_0 < 0`; every flow finite.

## Reference

- **Spec:** Short, Packey & Holt 1995, NREL/TP-462-5173 (net savings over investment;
  undiscounted form), https://www.nrel.gov/docs/legosti/old/5173.pdf.
- **Reference implementation:** explicit formula, Python `math.fsum`.
- **Fixtures:** `roi-fixtures.json` (60 cases), `scripts/fixtures/economics.py`.
- **Convention check:** no reference library or SAM module isolates this method (SAM
  `Cashloan` bundles taxes and financing); a hand-derived example pins the undiscounted ratio.
- **Tolerance:** `1e-14` relative (absolute where expected is 0). Observed max error: 0.
