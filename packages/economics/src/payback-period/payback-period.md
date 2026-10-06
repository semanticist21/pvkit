# payback-period — simple and discounted payback

## Principle

First year `t` where the cumulative cash flow `Σ_{k≤t} CF_k/(1 + r)^k` reaches 0; the
crossing is interpolated linearly inside year `t` (cash assumed even through the year):
`payback = (t − 1) + |cum_{t−1}| / CF_t`. `r = 0` (default) gives simple payback, `r > 0`
discounted payback. 0 when the cumulative flow turns positive without ever going negative
(`CF_0 > 0`, or `CF_0 = 0` — e.g. an incentive equal to the capital cost — followed by
positive years); a zero year 0 followed by a net-negative year pays back only once the
cumulative recovers. `Infinity` when the horizon never pays back (incl. all-zero or empty
flows). A later dip below 0 (e.g. a replacement) does not reset the result — first crossing
wins. Guards: `r` finite > −1; every flow finite.

## Reference

- **Spec:** Short, Packey & Holt 1995, NREL/TP-462-5173 (simple and discounted
  payback), https://www.nrel.gov/docs/legosti/old/5173.pdf.
- **Reference implementation:** explicit formula, Python float64 (no reference library
  implements payback; the zero-year-0 rule above is pvkit's, pinned by these cases).
- **Fixtures:** `payback-period-fixtures.json` (64 cases: hand checks, exact-year payback,
  CF_0 = 0 then positive / negative / recovering, all-zero, never, discounted, dip after
  crossing, 54 random), `scripts/fixtures/economics.py`.
- **Convention check:** no reference library or SAM module isolates this method (SAM
  `Cashloan` bundles taxes and financing); a hand-derived example pins simple and
  discounted payback (year 0 undiscounted, linear in-year interpolation).
- **Tolerance:** `1e-12` years absolute. Observed max error: 0.
