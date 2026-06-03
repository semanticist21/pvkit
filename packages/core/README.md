# @pvkit/core

PV (solar) performance modeling core. Zero dependencies, ESM-only,
function-level tree-shaking.

> For broader context and positioning, see the [monorepo README](../../README.md).

## Scope (initial — just this)

| Module | Subpath | Spec (papers) |
| --- | --- | --- |
| `solarposition` | `@pvkit/core/solarposition` | NOAA SPA (Reda & Andreas 2004) |
| `irradiance` | `@pvkit/core/irradiance` | Perez 1990 · Hay-Davies · Isotropic |
| `temperature` | `@pvkit/core/temperature` | SAPM · PVsyst |
| `pvsystem` | `@pvkit/core/pvsystem` | PVWatts (NREL) |

High-level objects (ModelChain-style) come later. Low-level functions first.

## Correctness

Implementations are written from the published literature. Outputs are pinned
as fixtures and cross-checked against established reference implementations, so
each model is numerically validated rather than merely "running."

## Unit safety

`units.ts` provides branded `Radians` / `Degrees` types. rad/deg mix-ups are
caught at compile time, with zero runtime cost (the brand is erased at build).

```ts
import { radians, toDegrees } from "@pvkit/core";

toDegrees(radians(Math.PI)); // 180
```

## Open decisions (lock before implementing)

1. **Naming convention** — `snake_case` vs `camelCase`.
   _Proposed: camelCase_, following JS ecosystem convention.
2. **Time-series data structure** — `{t, v}[]` array (better DX) vs
   `Float64Array + timestamps` (perf / WASM-friendly).
   _Proposed: keep the core scalar (in/out), with time series as a thin
   adapter on top._ A scalar core supports both representations and keeps a
   future WASM boundary clean.

## Development

```bash
bun install        # from the monorepo root
bun test           # this package: bun run --filter @pvkit/core test
bun run build      # tsdown → dist (ESM + .d.ts + subpath exports)
```
