# @pvkit/economics — agent notes

Package-only facts. Shared rules (fixtures, references, numerics, release) live in
`doc/conventions.md` and `doc/architecture.md`; method list → `README.md` "Methods".

## Layout

- No module layer: `src/<method>/` holds `index.ts`, `<method>.ts`, `<method>.md`
  (`## Reference`), `<method>.test.ts`, `<method>-fixtures.json`. Public subpath
  `@pvkit/economics/<method>`; root entry `src/index.ts` re-exports every method.
- `src/sum.ts` is a copy of core's `compensatedSum` (zero runtime deps — no import of
  `@pvkit/core`). Keep the two in sync.
- Fixtures: `scripts/fixtures/economics.py` writes every `<method>-fixtures.json`;
  `economics-sam.py` writes the NREL SAM `<method>-sam-fixtures.json`.

## Decisions

- Methods take/return plain numbers and arrays; money is unitless, rates are fractions,
  energy kWh. Year 0 = today (undiscounted), flows at year end.
- Every numeric input, scalar or array element, must be finite — `RangeError` otherwise
  (`src/finite.ts`); no NaN propagation, no sentinel results from bad input.
- Pre-tax, unlevered. Taxes, depreciation, loans, tariff logic (monthly net metering,
  demand charges) are out of scope — callers edit the `cashFlows` array.
