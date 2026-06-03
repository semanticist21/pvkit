# @pvkit/core — agent notes

PV modeling core. Durable notes for future sessions — update when `src/` changes.

## Invariants

- **The papers are the spec.** Implement from the published literature.
- Pin outputs as fixtures and cross-check against an established reference
  implementation so each model is numerically validated.
- ESM-only, zero dependencies, `sideEffects: false`, function-level exports
  (tree-shaking).

## Locked decisions

- **API boundary: plain objects out, branded inside.** Public function inputs take
  plain object args with bare `number` fields, unit fixed by field name (no forced
  `degrees()`/`radians()` wrapping). Tag to branded `Radians`/`Degrees` internally;
  returned angles are branded. See `doc/architecture.md` → "API boundary".
- **Per-method subpath exports + per-method 4-file set.** Each calculation method
  is its own file `src/models/<module>/<method>.ts`, publicly importable at
  `@pvkit/core/<module>/<method>` (preferred granularity); the module subpath
  `@pvkit/core/<module>` re-exports them as a convenience. Wildcard `package.json`
  `exports` + glob tsdown entry = zero per-method wiring (new method = no config
  edit). Each method ships four co-located files: `<method>.ts` (impl),
  `<method>.md` (source URL + principle + tolerance), `<method>.test.ts`
  (tolerance-based accuracy, not bit-exact — JS float64), `<method>.bench.ts`
  (perf). See `doc/architecture.md` → "Subpath exports".

## Open decisions (lock before implementing)

1. Naming — camelCase proposed (JS convention).
2. Time-series data structure — scalar in/out core + a thin adapter proposed.
   Keeps a future WASM boundary clean.

## Modules (all stubs — implementation order)

11 core submodules, dependency order:

1. `solarposition` (NOAA SPA + simple models) — everything depends on sun position → first.
2. `atmosphere` (Kasten-Young air mass, alt2pres, precipitable water, Linke/AOD) —
   dataless helpers consumed by clearsky/irradiance. Air mass lives here.
3. `clearsky` (Haurwitz / Ineichen / Solis) — fallback irradiance when no weather data.
   Linke turbidity is a caller input; lookup raster + detect_clearsky → `@pvkit/io`.
4. `irradiance` (isotropic / Klucher / Hay-Davies / Reindl / King / Perez + AOI,
   get_total_irradiance, poa_components)
5. `decomposition` (Erbs / Boland / DISC / DIRINT / DIRINDEX) — GHI→DNI/DHI splitters;
   essential because most weather feeds give GHI only. DIRINT needs time-series adapter.
6. `iam` (physical / ashrae / martin_ruiz / sapm / interp / marion)
7. `temperature` (SAPM / PVsyst / Faiman / Fuentes / noct_sam / ross / GenericLinearModel)
8. `tracking` (singleaxis / backtracking / axis tilt) — pure geometry, depends only on
   solarposition. GCR is scalar, not 3D → core, NOT layout.
9. `pvsystem` (PVWatts DC/AC, inverter clipping, system losses) → kWh.
10. `losses` (soiling kimber/hsu, combine_loss_factors, snow optional).
11. `metrics` (IEC 61724-1: PR, specific yield, capacity factor, availability).

Out of core (separate packages): single-diode/SAPM precision + inverters → `@pvkit/diode`;
parameter DBs + spectrum → `@pvkit/spec`; bifacial/shading → `@pvkit/layout`; data fetch →
`@pvkit/io`; ModelChain orchestration → `@pvkit/chain`.

Full feature checklist: `features.md`.

## Validation workflow

Implement from the paper → pin reference outputs for the same inputs as fixtures
→ assert against them in `*.test.ts` (`bun test`). No core logic without a test.
