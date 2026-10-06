# @pvkit/diode — agent notes

Package-only facts. Shared rules (fixtures, references, numerics, release) live in
`doc/conventions.md` and `doc/architecture.md`; method list → `README.md` "Methods".

## Layout

- No module layer: `src/<method>/` holds `index.ts`, `<method>.ts`, `<method>.md`
  (`## Reference`), `<method>.test.ts`, `<method>-fixtures.json`. Root entry re-exports all.
- `src/lambert-w.ts` (shared solver) is private: not a subpath. `src/testing.ts` is test-only
  and excluded from the build in `tsdown.config.ts`.
- Fixtures: `scripts/fixtures/diode.py` (pvlib pinned) writes every method's JSON. JSON has
  no NaN/Infinity — encoded as `null` / `"Infinity"`, restored by `testing.ts` `decode`.

## Decisions

- Input field names match `@pvkit/spec` records (`CecModule`, `SandiaModule`,
  `CecInverter`); outputs are camelCase pvlib names (`iSc`, `vOc`, `pMp`, …). Keep them
  aligned — `src/spec-compat.test.ts` (spec as devDependency only) fails at compile time
  if they drift.
- Lambert W is evaluated from the log of its argument (no overflow); this deliberately
  differs from pvlib, which returns NaN in `i_from_v` once the argument overflows.
- MPP: Newton + bisection on the diode voltage (Bishop form), exact to float64; the
  fixture reference uses `bishop88_mpp` brentq at 4ε, not pvlib's default ~1e-8 minimizer.
- `k/e` is the exact SI ratio — scipy's table value; a truncated 8.617333262e-5 costs 1e-10
  relative in `I0`.
- Out of scope so far: reverse-bias breakdown and thin-film recombination terms of
  `bishop88`, full I-V curve arrays, ADR coefficients in `@pvkit/spec`.
