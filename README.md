# pvkit

A modern, ESM-first TypeScript library for PV (solar) performance modeling —
built to run wherever JavaScript runs: browser, edge, Workers, React Native.

Implemented independently from the public, peer-reviewed literature
(NOAA SPA, Perez, Hay-Davies, SAPM, PVWatts, and friends).

## Positioning

Not "smarter PV science" — **"PV modeling everywhere JavaScript runs."**

- Runs directly in the browser / edge / Workers / RN — no backend round-trip
- Type- and unit-safe (branded types catch rad/deg mix-ups at compile time)
- Tree-shakeable, small bundles (function-level imports)
- Point-in-time / streaming friendly (not batch DataFrames) — good for realtime
- Curated: one validated best-practice path instead of dozens of model variants

## Correctness

- The papers are the spec. Implementations are written from the literature.
- Outputs are pinned as fixtures and checked against established reference
  implementations, so results are numerically validated, not just "it runs."
- Algorithms are open science — no license obligations. The API is our own design.

## Packages

| Package | Status | Description |
| --- | --- | --- |
| [`@pvkit/core`](packages/core) | 🚧 WIP | PV modeling core (solarposition · irradiance · temperature · pvsystem) |
| `@pvkit/sizer` | 📋 Planned | String sizing — series/parallel panel configuration (inverter over-voltage safety) |

See [ROADMAP.md](ROADMAP.md) for packages under consideration.

## Technical direction

- **ESM-only.** No CJS. Targets modern bundler environments (Vite / Next, etc.).
- Aggressive tree-shaking. `"sideEffects": false`, functional exports.
- Zero runtime dependencies. Pure TS.
- Build: `tsdown` (rolldown-based). ESM + `.d.ts` + subpath exports map.
- Heavy time-series numeric loops (e.g. SPA) may later move to an opt-in WASM
  (Rust) accelerated subpath. 1.0 ships pure JS first.

## Development

```bash
bun install
bun run build
bun run test
```
