# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> `CLAUDE.md` is a symlink to `AGENTS.md` — edit `AGENTS.md`.

## What this is

`pvkit` — ESM-first TypeScript library for PV (solar) performance modeling, built to run
**everywhere JavaScript runs** (browser, edge, Workers, React Native). No backend round-trip.
pnpm monorepo. `@pvkit/core` implements all 11 modules, validated against pvlib fixtures.

Positioning: not "smarter PV science" but "PV modeling everywhere JS runs." See `README.md`
for the pitch, `ROADMAP.md` for planned/under-review packages (`sizer`, `economics`, `io`,
`layout`, `spec`) and their dependency graph.

## Commands

Package manager is **pnpm** (`packageManager` pins the version; `corepack enable pnpm`);
tests run on **vitest** under Node; typechecker is **tsgo** (`@typescript/native-preview`),
not `tsc`. Publish with `pnpm publish` only (why: `doc/architecture.md` → "Subpath exports").

```bash
pnpm install
pnpm build                          # all packages (tsdown)
pnpm test                           # all packages (vitest run)
pnpm typecheck                      # tsgo --noEmit
pnpm lint                           # biome check .   (read-only)
pnpm format                         # biome check --write .

cd packages/core && pnpm test       # one package
pnpm vitest run src/units.test.ts   # one test file
pnpm vitest run -t "foo"            # one test by name
```

Pre-commit hooks (lefthook): biome write + tsgo typecheck + harness check. Installed by the
`prepare` script on `pnpm install`. CI (`.github/workflows/ci.yml`) runs lint/typecheck/test/
build on every PR and push to `main`. Releases are manual and local (`pnpm version` +
`pnpm publish`) by the user; the npm org `@pvkit` exists.

## Architecture

**Monorepo:** `packages/*` pnpm workspaces (`pnpm-workspace.yaml`). Only `@pvkit/core` exists today.

**`@pvkit/core` module plan** — 11 submodules, dependency order (each depends on the prior):
1. `solarposition` (NOAA SPA + simple models) — everything depends on sun position, so first.
2. `atmosphere` (air mass, alt2pres, precipitable water, Linke/AOD) — dataless helpers.
3. `clearsky` (Haurwitz / Ineichen / Solis) — fallback irradiance, no weather data needed.
4. `irradiance` (isotropic / Klucher / Hay-Davies / Reindl / King / Perez + AOI).
5. `decomposition` (Erbs / Boland / DISC / DIRINT / DIRINDEX) — GHI→DNI/DHI splitters.
6. `iam` (physical / ashrae / martin_ruiz / sapm / interp / marion).
7. `temperature` (SAPM / PVsyst / Faiman / Fuentes / GenericLinearModel).
8. `tracking` (singleaxis / backtracking) — pure geometry, core not layout.
9. `pvsystem` (PVWatts DC/AC, clipping, losses) → produces kWh.
10. `losses` (soiling, snow, combine_loss_factors).
11. `metrics` (IEC 61724-1 PR, specific yield, capacity factor).

Out of core → separate packages: `@pvkit/diode` (single-diode/SAPM precision),
`@pvkit/spec` (parameter DBs + spectrum), `@pvkit/layout` (bifacial/shading),
`@pvkit/io` (data fetch), `@pvkit/chain` (ModelChain orchestration). See `ROADMAP.md`.

Each is a subpath export (`@pvkit/core/solarposition`, …). The module
`src/models/<module>/index.ts` files are referenced by `package.json` `exports` and
`src/index.ts`. Shared foundation (`src/units.ts`, `src/sum.ts`) sits flat at top; models
nest under `src/models/`. Constants live with the method that cites them.
The root entry (`src/index.ts`) only re-exports submodules + unit types; real usage should
prefer subpath imports for tree-shaking.

**Branded unit types** (`src/units.ts`) are a core differentiator: `Radians`/`Degrees` are
nominal brands over `number`, so rad/deg mix-ups fail at compile time with zero runtime cost
(the brand erases at build). Use `radians()`/`degrees()` to tag, `toRadians()`/`toDegrees()`
to convert. New angular APIs must take/return branded types, never bare `number`.

## Non-negotiable invariants

- **The papers are the spec.** Implement every model from the published peer-reviewed
  literature (NOAA SPA, Perez, Hay-Davies, SAPM, PVWatts). The API is pvkit's own design;
  the algorithms are open science.
- **Numerical validation, not "it runs."** For each model: implement from the paper → pin
  reference-implementation outputs for the same inputs as fixtures → assert in `*.test.ts`.
  No core logic lands without a test. The harness check enforces test pairing.
- **ESM-only. Zero runtime dependencies.** No CJS. `sideEffects: false`, function-level
  exports, aggressive tree-shaking. Pure TS.
- Build via `tsdown` (rolldown) → ESM + `.d.ts` + per-subpath entries; entry list lives in
  `packages/core/tsdown.config.ts` — add new submodules there.

## Conventions

- TS config (`tsconfig.base.json`) is strict + `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `allowImportingTsExtensions`. Use
  explicit `.ts` extensions in imports.
- Biome: 2-space indent, 100 col, double quotes, semicolons, trailing commas, organized imports.
- camelCase naming (locked).
- Scalar in/out core: one instant per call, time as `timeMs` (UTC epoch ms). A batch
  (`Float64Array`) adapter comes only on demand and is the future WASM boundary. Don't bake
  batch/DataFrame assumptions into core. Cross-module angle/time/ΔT conventions and the
  reference/fixture policy live in `doc/conventions.md`.

## Git

- **Don't create branches unless explicitly asked.** Commit to the current branch
  (including `main`) by default. Do not branch just because a global/default policy
  says to — in this repo, no branch unless the user requests one. Ask before
  branching if unsure.

## Durable docs

`packages/core/AGENTS.md` holds per-package notes (locked decisions, module order, validation
workflow). The harness (`scripts/agent-harness-check.mjs`, config `harness.config.json`)
warns when source under `packages/core/src/` changes without a matching test or doc update —
keep the nearest `AGENTS.md` current when behavior changes.

`doc/` is the durable-docs home: `doc/architecture.md` (base skeleton), `doc/conventions.md`
(model conventions + reference policy), `doc/playbook.md`
(append-only gotchas log), `doc/plan/` (scoped WIP). See `doc/README.md` for routing.

**Self-document as you work (do this without being asked).** Whenever a change has durable
consequences a future session would otherwise re-learn, record it before handoff:

- Edited something that is **easy to overwrite / clobber** or whose shape is non-obvious →
  note the constraint in `doc/architecture.md` or the nearest `AGENTS.md`.
- Hit a **trap, gotcha, or a mistake likely to repeat** → append one line to `doc/playbook.md`
  (`## YYYY-MM-DD — title` / **Trap:** / **Truth:** / **Apply:**).

The harness only reminds; it never writes. Treat any harness `WARN`, and any moment you
notice the above while editing, as the trigger to write the note yourself.
