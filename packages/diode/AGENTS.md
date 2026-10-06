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
- Out of scope so far: reverse-bias breakdown and thin-film recombination terms of
  `bishop88`, full I-V curve arrays.
