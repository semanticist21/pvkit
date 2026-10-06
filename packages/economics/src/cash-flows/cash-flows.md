# cash-flows — annual project cash flows

## Principle

`CF_0 = −capitalCost + incentive`;
`CF_t = E_t · p · (1 + e_p)^(t−1) − c_om · (1 + e_om)^(t−1)`, `t = 1…n` (end-of-year
convention, Short et al. 1995). Pre-tax, unlevered; the result is a plain array, so
inverter replacement, taxes, depreciation or loan payments are added by editing it.
Guards: costs/price and every `E_t` finite; escalations finite > −1.

## Reference

- **Spec:** W. Short, D. J. Packey, T. Holt, "A Manual for the Economic Evaluation of
  Energy Efficiency and Renewable Energy Technologies", NREL/TP-462-5173, 1995,
  https://www.nrel.gov/docs/legosti/old/5173.pdf (cash-flow analysis).
- **Reference implementation:** explicit formula, Python float64.
- **Fixtures:** `cash-flows-fixtures.json` (60 cases), `scripts/fixtures/economics.py`.
- **Convention check:** no reference library or SAM module isolates this method (SAM
  `Cashloan` bundles taxes and financing); a hand-derived example pins escalation starting in year 2.
- **Tolerance:** `1e-14` relative (absolute where expected is 0). Observed max error: 0.
