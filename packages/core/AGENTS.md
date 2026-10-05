# @pvkit/core — agent notes

Package-only facts. Shared rules live in their owners:
I/O, units, fixtures → `doc/conventions.md`; layout, exports, numerics, release →
`doc/architecture.md`; method list → `README.md` "Modules"; status → `features.md`.

## Adding or changing a method

1. Folder `src/models/<module>/<method>/`: `index.ts` (re-exports), `<method>.ts`,
   `<method>.md` (equations + `## Reference`), `<method>.test.ts`, `<method>-fixtures.json`;
   `<method>.bench.ts` only if perf-critical (vitest 5 API — copy `solarposition/spa`).
2. Re-export it from the module `index.ts`; never import another module.
3. Fixture generator under `scripts/fixtures/` (one per method or per related group),
   run `pnpm fixtures`, and check the JSON is byte-identical on a second run.
4. `pnpm build` and commit the regenerated `package.json` exports (CI fails on drift).
5. Add the method to `README.md` "Modules" and tick `features.md`.

## Package decisions

- Root entry (`src/index.ts`) exports unit helpers only; models via subpaths.
- Every public field keeps one unit package-wide (table in `doc/conventions.md`); renames
  before 1.0 drop the old name, no aliases.
- Dropped on purpose: `king` transposition (no peer-reviewed source, deprecated in pvlib);
  snow (Marion) deferred; `iam/interp` is linear only (spline methods need scipy).
- Stateful models (fuentes, soiling) are step functions; DIRINT/DIRINDEX take explicit
  previous/next neighbour inputs.
- Out of core: single-diode/SAPM electrical + inverters → `@pvkit/diode`; parameter DBs +
  spectrum → `@pvkit/spec`; bifacial/shading → `@pvkit/layout`; data fetch, Linke raster,
  detect_clearsky → `@pvkit/io`; ModelChain → `@pvkit/chain`.
- Perf (Node 24): `spa` ≈ 18 µs/call, every other model < 0.4 µs — no WASM planned.
