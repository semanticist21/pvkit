# Architecture — base skeleton

Durable design facts for pvkit. Update when the shape changes. Agent-facing
instructions live in root `AGENTS.md`; the work queue in `ROADMAP.md`; this
file is the consolidated skeleton.

## Shape

- ESM-first TypeScript library for PV (solar) performance modeling. Runs
  everywhere JS runs (browser, edge, Workers, React Native) — no backend.
- pnpm monorepo; workspace layout and package list: root `AGENTS.md` → "Monorepo".
  Two published packages: `pvkit-js` (every model, 17 modules under `src/models/`) and
  `@pvkit/spec` (parameter databases, flat; see "`@pvkit/spec`"). Sections that name
  `src/models/` describe `pvkit-js`.
- Positioning: "PV modeling everywhere JS runs," not "smarter PV science."

## `pvkit-js` module order

Dependency order: `solarposition` → `atmosphere` → `clearsky` → `irradiance` →
`decomposition` → `iam` → `temperature` → `tracking` → `pvsystem` → `losses` → `metrics` →
`diode` → `layout` → `sizer` → `economics` → `io` → `chain`.
Method list (owner): `packages/pvkit/README.md` → "Modules".

Status checklist and deferred scope: `packages/pvkit/features.md`.

Each module is a subpath export (`pvkit-js/solarposition`, …) whose
`src/models/<module>/index.ts` is the convenience subpath entry re-exporting that
module's calculation methods. Individual methods are also importable one level
finer (`pvkit-js/<module>/<method>`) — see "Subpath exports" below. The tsdown
entry is a glob and tsdown generates the `exports` map from it on build, so a new
method or module file needs no hand-wiring.

## `@pvkit/spec`

A separate package only because its data (≈ 7 MB) must not be forced on every `pvkit-js` user.
No module layer:

- Each library is its own folder `src/<lib>/` (file set: `packages/spec/AGENTS.md`); public
  subpath `@pvkit/spec/<lib>`.
- The tsdown entry is index-only (`src/index.ts`, `src/*/index.ts`) plus its
  `data-json-parse` plugin, so flat helpers (`src/table.ts`) stay private. The exports map is
  generated the same way as `pvkit-js`'s (see "Subpath exports").
- Root entry `src/index.ts` exports only the record types (the tables are megabytes; import
  per table).
- `pvkit-js` never imports it at runtime; `diode` and `sizer` input names match its records so a
  row spreads in, and `pvkit-js` keeps it as a devDependency (`workspace:*`) for a compat test.

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
  the unit is fixed by the field name / JSDoc (e.g. latitude/longitude always degrees, tilt
  always degrees). Users never have to call `degrees()`/`radians()` to pass an
  argument. `spa({ timeMs, latitude: 37.5, longitude: 127 })`, not `spa(degrees(37.5), …)`.
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
  `sum.ts` (compensated summation). Physical constants and coefficients live in
  the method that cites them (no shared constants file). The 17 modules nest one layer
  down: `src/models/<module>/`. Public subpath names omit that layer (`pvkit-js/clearsky`) —
  only the internal path is `src/models/...`. Helpers that are not a method (e.g.
  `models/diode/lambert-w.ts`) are plain files in their module folder, never subpaths.
- Within each `src/models/<module>/`, every calculation method is its **own
  folder** `<method>/` (e.g. `solarposition/spa/`) holding the method's file set: `<method>/index.ts` (subpath entry that
  re-exports the impl), `<method>/<method>.ts` (impl), `<method>/<method>.md`
  (theory + Reference), `<method>/<method>.test.ts` (accuracy), and an optional
  `<method>/<method>.bench.ts` (perf, only where it matters). The module's own `index.ts`
  is the convenience subpath entry that re-exports each method folder. See
  "Module boundaries & tests".
- `dist/` mirrors this: `dist/models/<module>/<method>/index.js` + the module
  `index.js`; `package.json` `publishConfig.exports` points there. The tsdown
  entry is a **glob** (`src/models/**/*.ts` minus tests/benches), not an explicit
  list, so new method folders are auto-built with no wiring — and tsdown
  regenerates the `exports` map from that same entry glob on build (no
  hand-written wildcard lines).

## Subpath exports (method-level)

- **Per-method subpath is the preferred import granularity** (finest
  tree-shaking): `import { spa } from "pvkit-js/solarposition/spa"`. The
  module subpath `pvkit-js/solarposition` still works as a convenience — its
  `index.ts` re-exports the methods.
- **tsdown owns the `exports` map — it is generated, do not hand-edit.**
  `tsdown.config.ts` sets:

  ```ts
  exports: {
    devExports: true,        // dev `exports` → point at src
    customExports(exports) { /* normalize raw entries → public surface */ },
  }
  ```

  On every `pnpm build`, tsdown writes BOTH `exports` (dev → `src`) and
  `publishConfig.exports` (→ `dist`), plus `main`/`module`/`types`, from the
  tsdown entry glob. The `customExports` callback normalizes raw keys with three
  rules: (1) pass through non-model entries (`.`, `./units`, `./package.json`);
  (2) keep ONLY each folder's `index` entry, so per-method impl files (e.g.
  `solarposition/spa/spa.ts`) stay **private** — never a public subpath; (3)
  strip the internal `models/` prefix and collapse the trailing `/index`. Net
  public shape: `pvkit-js/<module>` and `pvkit-js/<module>/<method>`.
- **`publishConfig.access: "public"` is hand-set** (required for scoped `@pvkit/spec`, kept
  on `pvkit-js` for symmetry); tsdown's regeneration preserves it — keep it.
- **`exports`/`publishConfig`/`main`/`module`/`types` are machine-owned —
  regenerate, don't edit.** After adding or removing a method folder or module,
  run `pnpm build` to regenerate them and commit the updated `package.json`.
  Pre-commit hooks run biome/tsc/harness but NOT build, so a stale `exports` map
  is not auto-caught — rebuild whenever you change the module/method set. Why
  auto over hand-written wildcards: the map always matches real `dist` output (no
  drift), impl files are filtered out centrally, and there is nothing to
  hand-maintain; the cost is that build mutates `package.json` plus a small
  `customExports` callback.
- **Glob tsdown entry, zero wiring per method.** `tsdown.config.ts` entry is
  `src/index.ts`, `src/units.ts` and `src/models/**/*.ts` minus tests, benches and test
  helpers (`testing.ts`) — the `**` glob reaches into method folders, so new method
  folders are auto-built and feed the entry list that exports generation reads;
  tests and benches never ship to `dist`. `hash: false` keeps generated `dist`
  filenames (and thus the generated exports paths) stable, so `package.json` does
  not churn on every content change.
- **Release procedure (owner of this fact).** Only pnpm (and yarn) apply
  `publishConfig.exports`; `npm publish` of the package *directory* ships the dev
  `exports` (→ `src/*.ts`), which `files: ["dist"]` excludes — a broken package.
  Tags are per package: `pvkit-js@<x.y.z>` and `@pvkit/spec@<x.y.z>`. `pvkit-js` has no runtime
  dependency on `@pvkit/spec`, so they release independently in either order (a workspace
  runtime dependency would have to be published first: pack rewrites `workspace:` ranges to
  the dependency's current version). Per package (`<dir>` = `pvkit-js` or `spec`):
  1. Clean tree, then `cd packages/<dir> && pnpm version <x.y.z> --no-git-tag-version`;
     commit, tag (`pvkit-js@<x.y.z>` or `@pvkit/spec@<x.y.z>`), push commit + tag.
  2. `pnpm pack` and check the tarball's `package.json`: `exports` point at `./dist`,
     and `dependencies` hold no `workspace:` range.
  3. Publish: `pnpm publish` from an interactive terminal, or from an agent shell (no
     TTY → pnpm's OTP fails) `script -q /dev/null npm publish ./<tarball>.tgz
     --auth-type=web --access public` (`pvkit-<x.y.z>.tgz` or `pvkit-spec-<x.y.z>.tgz`) and
     hand the printed auth URL to the user.
  4. Poll `https://registry.npmjs.org/pvkit` (or `…/@pvkit%2fspec`) until the version is
     `latest` (a brand-new package first shows a `0.0.0-stage` placeholder for minutes).
  CI guards on the packed output: `scripts/check-consumer.mjs` packs `pvkit-js` and
  `@pvkit/spec` and typechecks/imports them as a consumer; `scripts/check-treeshake.mjs` covers
  `pvkit-js` only (its regex and paths assume the `dist/models/<module>/` layout).
- **TS consumers need `moduleResolution: "bundler"`** (or `node16`+) to resolve
  the generated subpath types.
- **Depth-agnostic.** Per-method subpath stays the preferred granularity, but
  deeper nesting (`pvkit-js/<module>/<theory>/<method>`) works automatically:
  the entry glob (`**`) and the `customExports` key-normalization are both
  depth-agnostic. Use a middle folder only where a model-family groups several
  methods.

## Module boundaries & tests

- **Per-method folder, file set.** Each calculation method lives in its own
  folder `src/models/<module>/<method>/` holding:
  - `index.ts` — method subpath entry; re-exports the impl (`export * from
    "./<method>.ts"`).
  - `<method>.ts` — implementation.
  - `<method>.md` — theory: principle/equations, assumptions, and a
    `## Reference` section (spec, reference implementation@version, fixture file,
    tolerance). Policy: `doc/conventions.md`.
  - `<method>.test.ts` — accuracy test: assert against the committed fixture JSON
    within the documented tolerance.
  - `<method>.bench.ts` — **optional**, `vitest bench`; add only for perf-critical
    methods (e.g. SPA), never as an empty placeholder.
- **Tests co-locate per method**, independent: `<method>.test.ts` sits in the
  method folder next to `<method>.ts` (top-level files like `units.ts` keep their
  flat `units.test.ts` companion). Each method pins its own reference fixtures —
  no shared fixture state across methods or modules.
- **JS numerical-limit caveat — tolerance-based, not bit-exact.** Accuracy tests
  assert within a documented tolerance, never exact equality: float64 only,
  large-angle accumulation (e.g. SPA Julian-day scaling), and platform-specific
  `Math.sin`/`Math.cos` differences all perturb the low bits. Each `<method>.md`
  must state the tolerance and its justification. Full rationale + the production
  failure modes and their fixes: "Numerical strategy — float64, zero deps" below.
- **Sharing is one-directional only.** A small foundation layer (`units.ts`,
  `sum.ts`) is imported *upward* by modules. Modules must NOT import
  each other (no `clearsky` → `irradiance`); cross-module relationships are
  data/function pipelines (`solarposition` output → `clearsky`/`irradiance`
  input), not code sharing. Cycles break tree-shaking and the build. Methods inside one
  module may import each other.
- **One exception: `chain`.** It is the orchestration module, so `model-chain` imports other
  modules' method folders by relative path (`../../atmosphere/absolute-airmass/index.ts`),
  never their module `index.ts`, so its bundle stays method-level. Nothing imports `chain`.

## Numerical strategy — float64, zero deps

pvkit computes in JS `number` (IEEE 754 float64) and nothing else. **No
decimal/BigInt/bignum library**, ever — they would break the zero-runtime-dep
invariant and buy *zero* accuracy that PV physics can use. This section is the
durable rationale and the rules; treat it as locked.

### Precision floor is a non-issue

float64 = 52-bit mantissa, ε ≈ 2.22e-16, ~15–16 significant decimal digits —
*identical* to C `double` (NREL SPA reference impl) and Python `float` (pvlib).
So pvkit matches the reference implementations natively. The headline SPA
accuracy (±0.0003°) needs ~7 digits; float64 gives ~15. Input data is the real
floor anyway: measured irradiance is ±2–5%, so a 1e-15 compute error is noise
~13 orders down. **Do not** reach for higher-precision arithmetic to "improve"
results — the bottleneck is physics and input data, not the float.

### What actually bites in production (ranked) and the fix

Each has a known, decades-old, zero-dep fix. Nothing here needs research.

1. **Time-series accumulation error — #1 real risk.** Lifetime energy =
   sum over 8760 hourly (or 525,600 minute) steps × 25 yr. Naïve `sum += x`
   accumulates rounding error over ~10^5–10^6 additions; the *money number*
   (lifetime kWh → ROI) drifts. **Fix:** Kahan/Neumaier compensated summation
   for every energy integral / long reduction — `compensatedSum` in `src/sum.ts`,
   used by `pvsystem/energy-kwh` and `metrics`. Never a plain `reduce((a,b)=>a+b)`.
2. **Time stored as float.** A Julian Date is ~2.46e6 (≈7 integer digits), so the
   float64 ULP there is ~0.04 ms — fine for a single conversion, but *accumulating*
   JD over decades erodes sub-second binning. **Fix:** store time as integer
   ms-epoch (`Date` /
   `number` ms is exact to ~285k yr via the 53-bit integer range); convert to JD
   only at the point of use, never persist an accumulated JD.
3. **Catastrophic cancellation near the horizon.** Sunrise/sunset, zenith > 85°,
   air mass ∝ 1/cos(z) blows up near 90°; small angle error → large irradiance
   error at dawn/dusk (matters for E/W-facing arrays, winter). **Fix:** clamp /
   guard near-horizon; follow each paper's refraction handling; put tolerance
   tests *at the hard angles* (85–90° zenith, sunrise/sunset), not only at noon.
4. **Large-argument trig.** SPA accumulates angles to thousands of degrees, then
   takes sin/cos; `Math.sin` of a huge argument loses precision in range
   reduction. **Fix:** reduce mod 360° (or 2π) *before every* trig call —
   `limitDegrees`/`limitRadians` in `src/units.ts`. This is in the SPA spec
   (`limit_degrees`); pvlib does it. Never skip it.
5. **Cross-engine reproducibility.** `Math.sin/cos/pow` differ by 1–2 ULP across
   V8 / JavaScriptCore / Hermes — same code, slightly different last bits on
   iPhone vs web. Usually noise, but a real support-ticket risk if any code does
   equality/threshold compares. **Fix:** never `===` a computed float; assert
   tolerance-equality only; document "results are tolerance-equal across
   platforms, not bit-identical."
6. **React Native / Hermes specifically.** pvkit's "everywhere JS" thesis
   includes RN, and Hermes has historically differed on `Math` edge cases and
   `Intl`. **Fix:** when CI matures, run the accuracy suite on Hermes, not just
   Node — this is the *one* novel verification point; everything else has prior
   art in pvlib/NREL.

### Rules (enforce in review)

- Energy/long sums → compensated (Kahan/Neumaier) summation, never naïve `+=`.
- Time persisted as integer ms-epoch; JD derived at use-site, never accumulated.
- Every trig call on an accumulated angle is preceded by
  `limitDegrees`/`limitRadians`.
- Tests of *physical-model accuracy* assert documented tolerance, never bit-exact
  equality; include near-horizon angles. Each `<method>.md` states its tolerance +
  justification. (Pure utility/identity tests — e.g. `limitDegrees(-1e-15) === 0`
  — may assert exact values; the tolerance rule scopes to model outputs perturbed
  by `Math`/float accumulation, not to exact arithmetic facts.)
- No `===`/`!==` on computed floats anywhere.
- Eventually: Hermes in CI.

## Banned terminology

- **Do NOT use the term "barrel" / "barrel file"** anywhere — code comments,
  docs, commit messages, PR text, or chat. Call `src/index.ts` the **root entry**
  (or "re-export entry"); call `src/models/<module>/index.ts` the **subpath entry**. The
  pattern itself is fine; only the word is banned.

## File-naming convention

- **All repo file names are kebab-case** (e.g. `features.md`, not `FEATURES.md`).
  Applies to docs and source alike. Code identifiers stay camelCase; only
  filenames are kebab.
