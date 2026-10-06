# lcoe — levelized cost of energy

## Principle

`LCOE = Σ_{t=0…n} C_t/(1 + r)^t ÷ Σ_{t=0…n} E_t/(1 + r)^t` — the constant price per kWh
whose discounted revenue equals the discounted cost (Short et al. 1995, without
taxes). Year 0 usually carries the installed cost and no energy. Degradation enters through
`E_t` (`lifetimeEnergy`); O&M escalation through `C_t`. Real vs nominal: use a real rate
with constant-dollar costs, a nominal rate with escalated ones. Guards: equal lengths;
`r` finite > −1.

## Reference

- **Spec:** Short, Packey & Holt 1995, NREL/TP-462-5173 (levelized cost of energy),
  https://www.nrel.gov/docs/legosti/old/5173.pdf.
- **Reference implementation:** explicit formula, Python float64 + `math.fsum`.
- **Fixtures:** `lcoe-fixtures.json` (60 cases: hand check 0.51, discounted, year-0 energy,
  57 random up to 40 years, r ∈ [−0.02, 0.12]), `scripts/fixtures/economics.py`.
- **Tolerance:** `1e-14` relative. Observed max error: 0.
