# irr — internal rate of return

## Principle

The `r > −1` solving `Σ CF_t / (1 + r)^t = 0`, i.e. the positive real roots `x` of the
polynomial `p(x) = Σ CF_t x^t` with `x = 1/(1 + r)` (zero flows at either end dropped; empty
or all-zero flows → `NaN`). Roots lie in `(0, B)`, `B = 1 + max|CF_t / CF_n|` (Cauchy).
One sign change in the coefficients means exactly one root (Descartes), bisected directly.
Otherwise every root is isolated exactly: the roots of `p^(k+1)` split `(0, B)` into
intervals where `p^(k)` is monotone, so a sign change at an interval's ends brackets its only
root there; this runs from `k = n − 1` down to `p` itself, so roots any distance apart are
found. Each bracket is bisected to adjacent floats (`x > 1` evaluated as `x^−n p(x)` so
nothing overflows). Of all roots the one with the smallest `|r|` is returned — the same
choice numpy-financial makes among multiple roots (non-conventional flows). An even-order
(tangent) root has no sign change and is found only if `p` evaluates to exactly 0 there.
Cost: O(n) per bisection step for one coefficient sign change, O(n³) otherwise.
Guard: every flow finite.

## Reference

- **Spec:** Short, Packey & Holt 1995, NREL/TP-462-5173 (internal rate of return),
  https://www.nrel.gov/docs/legosti/old/5173.pdf.
- **Reference implementation:** numpy-financial 1.0.0 `npf.irr` (polynomial roots via
  companion-matrix eigenvalues, real positive roots, smallest |rate|).
- **Fixtures:** `irr-fixtures.json` (67 cases: all npf docstring examples incl. multi-root
  `[-5, 10.5, 1, -8, 1]`, no-root, r = 0, empty and all-zero, closely spaced roots
  (0.10/0.104 and 0.10/0.102, alone and with a far root 0.5), zero flows at either end,
  51 random PV-like flows, 30 % with replacement costs), `scripts/fixtures/economics.py`.
- **Tolerance:** `1e-12` absolute in rate. A near-double root is ill-conditioned (both
  sides land up to 1.4e-13 apart on the close-root cases); elsewhere observed max 1.7e-15.
