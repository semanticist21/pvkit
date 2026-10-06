# pvkit — agent notes

Package-only facts. Shared rules: I/O, units, fixtures → `doc/conventions.md`; layout,
exports, numerics, release → `doc/architecture.md`; method list → `README.md` "Modules";
status and deferred scope → `features.md`.

## Adding or changing a method

1. Folder `src/models/<module>/<method>/`: `index.ts` (re-exports), `<method>.ts`,
   `<method>.md` (equations + `## Reference`), `<method>.test.ts`, `<method>-fixtures.json`;
   `<method>.bench.ts` only if perf-critical (vitest 5 API: copy `solarposition/spa`).
2. Re-export it from the module `index.ts`. Never import another module (only `chain` may);
   methods inside one module may import each other
   (layout `min-pitch` → `projected-solar-zenith-angle`).
3. Fixture generator under `scripts/fixtures/` (one per method or related group), run
   `pnpm fixtures`, and check the JSON is byte-identical on a second run.
4. `pnpm build` and commit the regenerated `package.json` exports (CI fails on drift).
5. Add the method to `README.md` "Modules" (and its trust-table count) and tick `features.md`.

Non-method helpers (`economics/finite.ts`, `diode/lambert-w.ts`, test-only `diode/testing.ts`
excluded in `tsdown.config.ts`) are plain files in their module folder, never subpaths.

## Package decisions

- Root entry exports unit helpers only; models via subpaths. Zero runtime dependencies:
  `@pvkit/spec` is a devDependency for `diode/spec-compat.test.ts` only.
- One unit per public field package-wide (table in `doc/conventions.md`); renames before 1.0
  drop the old name, no aliases.
- `tsconfig.json` adds the `DOM` lib for `io` (`fetch`, `URL`, `AbortSignal`); no other module
  may use browser-only APIs.
- Stateful models (fuentes, soiling) are step functions; DIRINT/DIRINDEX take explicit
  previous/next neighbour inputs.
- `diode` and `sizer` input names match `@pvkit/spec` records (`CecModule`, `SandiaModule`,
  `CecInverter`) so rows spread in; `spec-compat.test.ts` fails at compile time on drift.
  Diode outputs are camelCase pvlib names (`iSc`, `vOc`, `pMp`). Diode fixture JSON encodes
  NaN/Infinity as `null`/`"Infinity"`, restored by `testing.ts` `decode`.
- `sizer.stringSize` takes `vocMax`/`vmpMin` already corrected (its methods never call each
  other). No library implements string sizing, so fixtures evaluate the NEC 690.7 formulas in
  Python plus cited worked examples. `layout` `min-pitch` and `roof-fit` have no external
  reference either: checked as the root of `shadedFraction1d` and by hand counts.
- `economics`: plain numbers; money unitless, rates fractions, energy kWh; year 0 = today,
  flows at year end. Every numeric input must be finite (`RangeError`, no NaN propagation).
  Pre-tax, unlevered; tariffs, taxes and loans are the caller's edits to `cashFlows`.
- `io`: each source exports `get<Source>` (fetch) and `parse<Source>` (pure). Query strings
  copy pvlib's byte for byte; fixtures run pvlib's own `get_*` with `requests.get` stubbed to
  the captured `<method>-raw.json`. `fetch`/`signal` injectable; no retries or caching; tests
  never hit the network.
- `chain`: scalar like every module; one model set (pvlib `ModelChain`, PVWatts DC/AC/losses,
  Hay–Davies default), fixed tilt only. Sun position refracts at the step's `tempAir`, or
  12 °C when omitted (cell temperature then uses 20 °C), matching ModelChain.
