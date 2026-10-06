# lcoe — levelized cost of energy

## Principle

`LCOE = Σ_{t=0…n} C_t/(1 + r)^t ÷ Σ_{t=0…n} E_t/(1 + r)^t` — the constant price per kWh
whose discounted revenue equals the discounted cost (Short et al. 1995, without
taxes). Year 0 usually carries the installed cost and no energy. Degradation enters through
`E_t` (`lifetimeEnergy`); O&M escalation through `C_t`. Real vs nominal: use a real rate
with constant-dollar costs, a nominal rate with escalated ones. Guards: equal lengths;
every element finite; `r` finite > −1; `Σ E_t/(1 + r)^t > 0` (else nothing to levelize).

## Reference

- **Spec:** Short, Packey & Holt 1995, NREL/TP-462-5173 (levelized cost of energy),
  https://www.nrel.gov/docs/legosti/old/5173.pdf.
- **Reference implementation:** explicit formula, Python float64 + `math.fsum` (arithmetic);
  NREL SAM via PySAM 7.1.1.post1 (`scripts/fixtures/economics-sam.py`) `Lcoefcr` with
  `fixed_charge_rate` = capital recovery factor `r(1+r)^n/((1+r)^n − 1)`, which equals the
  discounted form for year-0 capital and constant O&M and energy (convention: year 0
  undiscounted, flows at year end).
- **Fixtures:** `lcoe-fixtures.json` (60 cases: hand check 0.51, discounted, year-0 energy,
  57 random up to 40 years, r ∈ [−0.02, 0.12]), `scripts/fixtures/economics.py`.
  `lcoe-sam-fixtures.json` (8 cases, 5–40 years, r 1–12 %).
- **Tolerance:** `1e-14` relative vs the formula (observed 0); `1e-12` vs SAM (observed
  1.8e-15).
