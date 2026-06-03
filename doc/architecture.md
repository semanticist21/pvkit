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
2. `atmosphere` (Kasten-Young air mass, alt2pres, precipitable water, Linke/AOD) —
   dataless helpers consumed by clearsky/irradiance.
3. `clearsky` (Haurwitz / Ineichen) — fallback irradiance when no weather data.
4. `irradiance` (Perez / Hay-Davies / Isotropic + AOI).
5. `decomposition` (Erbs / Boland / DISC / DIRINT) — GHI → DNI/DHI splitters.
6. `iam` (physical / ashrae / martin_ruiz / sapm) — incidence-angle modifier.
7. `temperature` (SAPM / PVsyst).
8. `tracking` (singleaxis / backtracking) — pure geometry, depends on solarposition.
9. `pvsystem` (PVWatts) → kWh.
10. `losses` (soiling kimber/hsu, combine_loss_factors) — optional derates.
11. `metrics` (IEC 61724-1: PR, specific yield, capacity factor, availability).

Full checklist: `packages/core/features.md`.

Each module is a subpath export (`@pvkit/core/solarposition`, …) whose
`src/models/<module>/index.ts` is the convenience subpath entry re-exporting that
module's calculation methods. Individual methods are also importable one level
finer (`@pvkit/core/<module>/<method>`) — see "Subpath exports" below. Both the
`exports` map and the tsdown entry are wildcard/glob, so a new method or module
file needs no wiring.

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
  `constants.ts` (universal physics constants). The 11 PV models nest one layer
  down: `src/models/<module>/`. Public subpath names are unchanged
  (`@pvkit/core/clearsky`) — only the internal path is `src/models/...`.
- Within each `src/models/<module>/`, every calculation method is its own file
  `<method>.ts` (e.g. `solarposition/spa.ts`), each with three companions:
  `<method>.md` (theory + tolerance), `<method>.test.ts` (accuracy test),
  `<method>.bench.ts` (perf). `index.ts` is the convenience subpath entry that
  re-exports the module's methods. See "Module boundaries & tests".
- `dist/` mirrors this: `dist/models/<module>/<method>.js` + `index.js`;
  `package.json` `publishConfig.exports` points there. The tsdown entry is a
  **glob** (`src/models/**/*.ts` minus tests/benches), not an explicit list, so
  new method files are auto-built with no wiring.

## Subpath exports (method-level)

- **Per-method subpath is the preferred import granularity** (finest
  tree-shaking): `import { spa } from "@pvkit/core/solarposition/spa"`. The
  module subpath `@pvkit/core/solarposition` still works as a convenience — its
  `index.ts` re-exports the methods.
- **Zero wiring per method.** `package.json` `exports` is wildcard:

  ```jsonc
  {
    "./*": "./src/models/*/index.ts",          // module level (auto for all)
    "./solarposition/*": "./src/models/solarposition/*.ts", // method level
    "./atmosphere/*": "./src/models/atmosphere/*.ts"
    // …one method-wildcard line per module; module level is auto via "./*"
  }
  ```

  `publishConfig.exports` mirrors the same patterns to `dist` with
  `types` + `default`. Adding a **method** file needs no `package.json` edit;
  adding a **module** needs one method-wildcard line (module level is already
  covered by `./*`).
- **Glob tsdown entry, zero wiring per method.** `tsdown.config.ts` entry is
  `["src/index.ts", "src/models/**/*.ts", "!src/models/**/*.test.ts",
  "!src/models/**/*.bench.ts"]` — new method files are auto-built; tests and
  benches never ship to `dist`.
- **TS consumers need `moduleResolution: "bundler"`** (or `node16`+) to resolve
  the wildcard subpath types.

## Module boundaries & tests

- **Per-method 4-file set.** Each calculation method ships four co-located files
  under `src/models/<module>/`:
  - `<method>.ts` — implementation.
  - `<method>.md` — theory: source URL(s) of the paper/reference, the
    principle/equations, assumptions, and the stated accuracy tolerance + which
    reference (e.g. pvlib, NREL SPA appendix) the fixtures come from.
  - `<method>.test.ts` — accuracy test: assert against pinned reference outputs
    within a documented tolerance.
  - `<method>.bench.ts` — performance benchmark (per-call timing, regression watch).
- **Tests co-locate per method**, independent: `<method>.test.ts` next to
  `<method>.ts` (as `units.test.ts` already does at top level). Each method pins
  its own reference fixtures — no shared fixture state across methods or modules.
- **JS numerical-limit caveat — tolerance-based, not bit-exact.** Accuracy tests
  assert within a documented tolerance, never exact equality: float64 only,
  large-angle accumulation (e.g. SPA Julian-day scaling), and platform-specific
  `Math.sin`/`Math.cos` differences all perturb the low bits. Each `<method>.md`
  must state the tolerance and its justification.
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
