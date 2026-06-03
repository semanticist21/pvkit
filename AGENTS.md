# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> `CLAUDE.md` is a symlink to `AGENTS.md` — edit `AGENTS.md`.

## What this is

`pvkit` — ESM-first TypeScript library for PV (solar) performance modeling, built to run
**everywhere JavaScript runs** (browser, edge, Workers, React Native). No backend round-trip.
Bun monorepo. Currently `@pvkit/core` is scaffolded; PV models are **stubs** (frame only).

Positioning: not "smarter PV science" but "PV modeling everywhere JS runs." See `README.md`
for the pitch, `ROADMAP.md` for planned/under-review packages (`sizer`, `economics`, `io`,
`layout`, `spec`) and their dependency graph.

## Commands

Runtime is **Bun** (`bun@1.3.14`); typechecker is **tsgo** (`@typescript/native-preview`),
not `tsc`.

```bash
bun install
bun run build                       # all packages (tsdown)
bun run test                        # all packages (bun test)
bun run typecheck                   # tsgo --noEmit
bun run lint                        # biome check .   (read-only)
bun run format                      # biome check --write .

cd packages/core && bun test        # one package
bun test src/units.test.ts          # one test file
bun test --test-name-pattern "foo"  # one test by name
```

Pre-commit hooks (lefthook): biome write + tsgo typecheck + harness check. Install with
`bunx lefthook install` (run automatically via the `prepare` script on `bun install`).

## Architecture

**Monorepo:** `packages/*` Bun workspaces. Only `@pvkit/core` exists today.

**`@pvkit/core` module plan** (implementation order — each depends on the prior):
1. `solarposition` (NOAA SPA) — everything depends on sun position, so first.
2. `irradiance` (Perez / Hay-Davies / Isotropic + AOI)
3. `temperature` (SAPM / PVsyst)
4. `pvsystem` (PVWatts) → produces kWh.

Each is a subpath export (`@pvkit/core/solarposition`, …). The module
`src/models/<module>/index.ts` files are referenced by `package.json` `exports` and
`src/index.ts`; stubs exist (`export {}`) — fill them when implementing. Shared foundation
(`src/units.ts`, `src/constants.ts`) sits flat at top; models nest under `src/models/`.
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
- camelCase naming (open decision — see `packages/core/AGENTS.md`).
- Time-series shape is an **open decision**: scalar in/out core + thin adapter, to keep a
  future opt-in WASM (Rust) boundary clean. Don't bake batch/DataFrame assumptions into core.

## Git

- **Don't create branches unless explicitly asked.** Commit to the current branch
  (including `main`) by default. Do not branch just because a global/default policy
  says to — in this repo, no branch unless the user requests one. Ask before
  branching if unsure.

## Durable docs

`packages/core/AGENTS.md` holds per-package notes (open decisions, module order, validation
workflow). The harness (`scripts/agent-harness-check.mjs`, config `harness.config.json`)
warns when source under `packages/core/src/` changes without a matching test or doc update —
keep the nearest `AGENTS.md` current when behavior changes.

`doc/` is the durable-docs home: `doc/architecture.md` (base skeleton), `doc/playbook.md`
(append-only gotchas log), `doc/plan/` (scoped WIP). See `doc/README.md` for routing.

**Self-document as you work (do this without being asked).** Whenever a change has durable
consequences a future session would otherwise re-learn, record it before handoff:

- Edited something that is **easy to overwrite / clobber** or whose shape is non-obvious →
  note the constraint in `doc/architecture.md` or the nearest `AGENTS.md`.
- Hit a **trap, gotcha, or a mistake likely to repeat** → append one line to `doc/playbook.md`
  (`## YYYY-MM-DD — title` / **Trap:** / **Truth:** / **Apply:**).

The harness only reminds; it never writes. Treat any harness `WARN`, and any moment you
notice the above while editing, as the trigger to write the note yourself.
