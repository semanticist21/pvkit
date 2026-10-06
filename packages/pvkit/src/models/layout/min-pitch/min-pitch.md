# min-pitch

Setting the shaded fraction (see shaded-fraction1d) to zero for equal rows on flat ground
(R₁ = R₂ = β, d = 0, βc = 0) gives 1 − (P/W) cos θT / |cos(β − θT)| = 0, so

P_min = W·cos(β − θT) / cos θT  (θT > 0, sun in front of the rows).

With θT ≤ 0 the sun is behind the rows in their cross-section: a neighbour's shadow can only
fall on the rear face, so P_min is the footprint W·cos β (the θT = 0 limit). Eq. 32 itself is
face-agnostic and would return a rear-face root there — not what a monofacial layout needs.

For the sun in the row cross-section at elevation α this is the textbook
W(cos β + sin β / tan α).

## Reference

1. Spec — Anderson & Jensen 2024 eq. 32 (see shaded-fraction1d), solved for P.
2. Reference implementation — `layout/shaded-fraction1d` (itself pinned to pvlib):
   the test checks shade is 0 at P_min and > 0 at 0.99·P_min, plus the textbook formula.
3. No fixture file. Tolerance 1e-12: closed forms checked against each other in double
   precision (a few ulp of rounding), far below any pitch that matters.
