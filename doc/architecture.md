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
2. `clearsky` (Haurwitz / Ineichen) — depends only on solarposition; fallback
   irradiance input when no weather data fetched.
3. `irradiance` (Perez / Hay-Davies / Isotropic + AOI)
4. `temperature` (SAPM / PVsyst)
5. `pvsystem` (PVWatts) → kWh + metrics (PR, specific yield, capacity factor).

Full checklist: `packages/core/features.md`.

Each is a subpath export (`@pvkit/core/solarposition`, …). Module
`src/models/<module>/index.ts` files are referenced by `package.json` `exports`
+ `src/index.ts`; stubs exist (`export {}`) — fill when implementing, and add the
entry to `packages/core/tsdown.config.ts`.

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

## API boundary — branded inside, plain objects outside

- **Public function inputs take plain object args with bare `number` fields**;
  the unit is fixed by the field name / JSDoc (e.g. lat/lon always degrees, tilt
  always degrees). Users never have to call `degrees()`/`radians()` to pass an
  argument. `spa({ lat: 37.5, lon: 127 })`, not `spa(degrees(37.5), …)`.
- **Internally, tag at the boundary** (`degrees()`/`radians()`) and use branded
  `Radians`/`Degrees` for all cross-module data and intermediate math — that is
  where rad/deg mix-ups are caught at compile time.
- **Returned angles SHOULD be branded** so the caller knows the unit (or the
  return shape names the unit explicitly). The brand erases at build → zero
  runtime cost, invisible to JS consumers.
- Net: branded types are an internal safety net, transparent to library users.
  Never force a consumer to wrap inputs.

## Source layout

- Shared foundation sits flat at `src/` top: `units.ts` (public unit types),
  `constants.ts` (universal physics constants). The 5 PV models nest one layer
  down: `src/models/<module>/index.ts`. Public subpath names are unchanged
  (`@pvkit/core/clearsky`) — only the internal path is `src/models/...`.
- `dist/` mirrors this: `dist/models/<module>/index.js`; `package.json`
  `publishConfig.exports` points there. tsdown entry list
  (`tsdown.config.ts`) lists `src/models/<module>/index.ts`.

## Module boundaries & tests

- **Tests co-locate inside the module**, independent:
  `src/models/<module>/index.test.ts` next to `index.ts` (as `units.test.ts`
  already does at top level). Each module pins its own reference fixtures — no
  shared fixture state across modules.
- **Sharing is one-directional only.** A small foundation layer (`units.ts`,
  shared geo/time types) is imported *upward* by modules. Modules must NOT import
  each other (no `clearsky` → `irradiance`); cross-module relationships are
  data/function pipelines (`solarposition` output → `clearsky`/`irradiance`
  input), not code sharing. Cycles break tree-shaking and the build.

## Banned terminology

- **Do NOT use the term "barrel" / "barrel file"** anywhere — code comments,
  docs, commit messages, PR text, or chat. Call `src/index.ts` the **root entry**
  (or "re-export entry"); call `src/<module>/index.ts` the **subpath entry**. The
  pattern itself is fine; only the word is banned.

## File-naming convention

- **All repo file names are kebab-case** (e.g. `features.md`, not `FEATURES.md`).
  Applies to docs and source alike. Code identifiers stay camelCase (see Open
  decisions); only filenames are kebab.

## Open decisions

See `packages/core/AGENTS.md` — naming (camelCase proposed) and time-series shape
(scalar in/out core + thin adapter, to keep a future WASM boundary clean).
