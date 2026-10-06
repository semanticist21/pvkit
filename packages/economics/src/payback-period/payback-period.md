# payback-period — simple and discounted payback

## Principle

First year `t` where the cumulative cash flow `Σ_{k≤t} CF_k/(1 + r)^k` reaches 0; the
crossing is interpolated linearly inside year `t` (cash assumed even through the year):
`payback = (t − 1) + |cum_{t−1}| / CF_t`. `r = 0` (default) gives simple payback, `r > 0`
discounted payback. 0 when `CF_0 ≥ 0`; `Infinity` when the horizon never pays back. A
later dip below 0 (e.g. a replacement) does not reset the result — first crossing wins.

## Reference

- **Spec:** Short, Packey & Holt 1995, NREL/TP-462-5173 (simple and discounted
  payback).
- **Reference implementation:** explicit formula, Python float64.
- **Fixtures:** `payback-period-fixtures.json` (60 cases: hand checks, exact-year payback,
  CF_0 ≥ 0, never, discounted, dip after crossing, 54 random), `economics.py`.
- **Tolerance:** `1e-12` years absolute. Observed max error: 0.
