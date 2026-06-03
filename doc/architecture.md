# Architecture — base skeleton

Durable design facts for pvkit. Update when the shape changes. Agent-facing
instructions live in root `AGENTS.md`; planned packages in `ROADMAP.md`; this
file is the consolidated skeleton.

## Shape

- ESM-first TypeScript library for PV (solar) performance modeling. Runs
  everywhere JS runs (browser, edge, Workers, React Native) — no backend.
- Bun monorepo, `packages/*` workspaces. Only `@pvkit/core` exists today; PV
  models are stubs (frame only).
- Positioning: "PV modeling everywhere JS runs," not "smarter PV science."

## `@pvkit/core` module order

Each depends on the prior; implement in order:

1. `solarposition` (NOAA SPA) — everything depends on sun position → first.
2. `irradiance` (Perez / Hay-Davies / Isotropic + AOI)
3. `temperature` (SAPM / PVsyst)
4. `pvsystem` (PVWatts) → produces kWh.

Each is a subpath export (`@pvkit/core/solarposition`, …). Submodule
`src/*/index.ts` files are referenced by `package.json` `exports` + `src/index.ts`
but do not exist yet — create when implementing, and add the entry to
`packages/core/tsdown.config.ts`.

## Core invariants

- **The papers are the spec.** Implement from peer-reviewed literature; the API
  is pvkit's design, the algorithms are open science.
- **Numerical validation, not "it runs."** Implement from paper → pin
  reference-implementation outputs as fixtures → assert in `*.test.ts`.
- **ESM-only, zero runtime deps.** `sideEffects: false`, function-level exports,
  aggressive tree-shaking.
- **Branded unit types** (`src/units.ts`): `Radians`/`Degrees` are nominal brands
  over `number` — rad/deg mix-ups fail at compile time, zero runtime cost. New
  angular APIs take/return branded types, never bare `number`.

## Open decisions

See `packages/core/AGENTS.md` — naming (camelCase proposed) and time-series shape
(scalar in/out core + thin adapter, to keep a future WASM boundary clean).
