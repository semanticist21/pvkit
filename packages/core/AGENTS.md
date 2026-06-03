# @pvkit/core — agent notes

PV modeling core. Durable notes for future sessions — update when `src/` changes.

## Invariants

- **The papers are the spec.** Implement from the published literature.
- Pin outputs as fixtures and cross-check against an established reference
  implementation so each model is numerically validated.
- ESM-only, zero dependencies, `sideEffects: false`, function-level exports
  (tree-shaking).

## Open decisions (lock before implementing)

1. Naming — camelCase proposed (JS convention).
2. Time-series data structure — scalar in/out core + a thin adapter proposed.
   Keeps a future WASM boundary clean.

## Modules (all stubs — implementation order)

1. `solarposition` (NOAA SPA) — everything else depends on sun position → first.
2. `irradiance` (Perez / Hay-Davies / Isotropic + AOI)
3. `temperature` (SAPM / PVsyst)
4. `pvsystem` (PVWatts)

## Validation workflow

Implement from the paper → pin reference outputs for the same inputs as fixtures
→ assert against them in `*.test.ts` (`bun test`). No core logic without a test.
