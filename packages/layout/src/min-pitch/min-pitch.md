# min-pitch

Setting the shaded fraction (see shaded-fraction1d) to zero for equal rows on flat ground
(R₁ = R₂ = β, d = 0, βc = 0) gives 1 − (P/W) cos θT / |cos(β − θT)| = 0, so

P_min = W·|cos(β − θT)| / cos θT.

For the sun in the row cross-section at elevation α this is the textbook
W(cos β + sin β / tan α).

## Reference

1. Spec — Anderson & Jensen 2024 eq. 32 (see shaded-fraction1d), solved for P.
2. Reference implementation — this package's `shadedFraction1d` (itself pinned to pvlib):
   the test checks shade is 0 at P_min and > 0 at 0.99·P_min, plus the textbook formula.
3. No fixture file. Tolerance 1e-12.
