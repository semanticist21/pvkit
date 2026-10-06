# irr — internal rate of return

## Principle

The `r > −1` solving `Σ CF_t / (1 + r)^t = 0`. With `g = ln(1 + r)` the NPV is
`Σ CF_t e^(−g t)`; a grid (step 0.005 in `g`, |g| ≤ 10 → r ∈ [−0.99995, ≈22 025]) is
scanned outward from 0 on both sides to the first sign change, bisected to adjacent
floats, and of the two candidates the one with the smaller `|r|` is returned — the same
choice numpy-financial makes among multiple roots (non-conventional flows). `NaN` when no
sign change exists (no IRR, or only a tangent root). Conventional flows (one sign change)
have exactly one root (Descartes).

## Reference

- **Spec:** L. J. Gitman, *Principles of Managerial Finance, Brief*, 3rd ed., 2003, p. 348;
  Short, Packey & Holt 1995, NREL/TP-462-5173
- **Reference implementation:** numpy-financial 1.0.0 `npf.irr` (polynomial roots via
  companion-matrix eigenvalues, real positive roots, smallest |rate|).
- **Fixtures:** `irr-fixtures.json` (60 cases: all npf docstring examples incl. multi-root
  `[-5, 10.5, 1, -8, 1]`, no-root, r = 0, 51 random PV-like flows, 30 % with replacement
  costs), `scripts/fixtures/economics.py`.
- **Tolerance:** `1e-12` absolute in rate. Observed max: 1.6e-15; the eigenvalue solve in
  npf is the less precise side, so the margin is for its error on stiffer flows.
