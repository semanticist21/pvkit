# @pvkit/core

PV (solar) performance modeling core. Zero dependencies, ESM-only,
function-level tree-shaking.

> For broader context and positioning, see the [monorepo README](../../README.md).

## Scope (initial — just this)

| Module | Subpath | Spec (papers) |
| --- | --- | --- |
| `solarposition` | `@pvkit/core/solarposition` | NREL SPA (Reda & Andreas 2004) ✓ |
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

## Usage

```ts
import { spa } from "@pvkit/core/solarposition/spa";

// Seoul, 2025-06-21 12:00 KST (03:00 UTC). Time is UTC epoch ms; angles in degrees.
const sun = spa({ timeMs: Date.UTC(2025, 5, 21, 3), latitude: 37.5665, longitude: 126.978 });
sun.apparentZenith; // refraction-corrected zenith
sun.azimuth;        // from north, clockwise
```

Conventions (time, angles, azimuth origin, ΔT): [`doc/conventions.md`](../../doc/conventions.md).

## Development

```bash
pnpm install       # from the monorepo root
pnpm test          # this package (vitest run)
pnpm bench         # perf-critical methods (vitest bench)
pnpm build         # tsdown → dist (ESM + .d.ts + subpath exports)
```
