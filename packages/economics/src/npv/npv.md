# npv — net present value

## Principle

`NPV = Σ_{t=0…n} CF_t / (1 + r)^t`; `CF_0` is today (undiscounted), as numpy-financial
`npv` and Short et al. 1995. Terms summed with Neumaier compensation. Guards: `r` finite > −1;
every flow finite.

## Reference

- **Spec:** Short, Packey & Holt 1995, NREL/TP-462-5173 (net present value),
  https://www.nrel.gov/docs/legosti/old/5173.pdf.
- **Reference implementation:** numpy-financial 1.0.0 `npf.npv`.
- **Fixtures:** `npv-fixtures.json` (60 cases: npf docstring example, r = 0, single flow,
  negative rate, 55 random PV-like flows incl. replacement costs), `scripts/fixtures/economics.py`.
- **Tolerance:** `1e-14` absolute after scaling by `Σ|CF_t|/(1 + r)^t` — npf sums naively
  and NPV can cancel to ~0, so relative error is meaningless. Observed max: 2.3e-16.
