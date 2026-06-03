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
finer (`@pvkit/core/<module>/<method>`) — see "Subpath exports" below. The tsdown
entry is a glob and tsdown generates the `exports` map from it on build, so a new
method or module file needs no hand-wiring.

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
- Within each `src/models/<module>/`, every calculation method is its **own
  folder** `<method>/` (e.g. `solarposition/spa/`) holding the method's 4-file
  set plus a method-level `index.ts` (the subpath entry that re-exports the
  impl): `<method>/index.ts`, `<method>/<method>.ts` (impl),
  `<method>/<method>.md` (theory + tolerance), `<method>/<method>.test.ts`
  (accuracy), `<method>/<method>.bench.ts` (perf). The module's own `index.ts`
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
  tree-shaking): `import { spa } from "@pvkit/core/solarposition/spa"`. The
  module subpath `@pvkit/core/solarposition` still works as a convenience — its
  `index.ts` re-exports the methods.
- **tsdown owns the `exports` map — it is generated, do not hand-edit.**
  `tsdown.config.ts` sets:

  ```ts
  exports: {
    devExports: true,        // dev `exports` → point at src
    customExports(exports) { /* normalize raw entries → public surface */ },
  }
  ```

  On every `bun run build`, tsdown writes BOTH `exports` (dev → `src`) and
  `publishConfig.exports` (→ `dist`), plus `main`/`module`/`types`, from the
  tsdown entry glob. The `customExports` callback normalizes raw keys with three
  rules: (1) pass through non-model entries (`.`, `./units`, `./package.json`);
  (2) keep ONLY each folder's `index` entry, so per-method impl files (e.g.
  `solarposition/spa/spa.ts`) stay **private** — never a public subpath; (3)
  strip the internal `models/` prefix and collapse the trailing `/index`. Net
  public shape: `@pvkit/core/<module>` and `@pvkit/core/<module>/<method>`,
  identical to before.
- **`exports`/`publishConfig`/`main`/`module`/`types` are machine-owned —
  regenerate, don't edit.** After adding or removing a method folder or module,
  run `bun run build` to regenerate them and commit the updated `package.json`.
  Pre-commit hooks run biome/tsgo/harness but NOT build, so a stale `exports` map
  is not auto-caught — rebuild whenever you change the module/method set. Why
  auto over hand-written wildcards: the map always matches real `dist` output (no
  drift), impl files are filtered out centrally, and there is nothing to
  hand-maintain; the cost is that build mutates `package.json` plus a small
  `customExports` callback.
- **Glob tsdown entry, zero wiring per method.** `tsdown.config.ts` entry is
  `["src/index.ts", "src/units.ts", "src/models/**/*.ts", "!**/*.test.ts",
  "!**/*.bench.ts"]` — the `**` glob reaches into method folders, so new method
  folders are auto-built and feed the entry list that exports generation reads;
  tests and benches never ship to `dist`. `hash: false` keeps generated `dist`
  filenames (and thus the generated exports paths) stable, so `package.json` does
  not churn on every content change.
- **TS consumers need `moduleResolution: "bundler"`** (or `node16`+) to resolve
  the generated subpath types.
- **Depth-agnostic.** Per-method subpath stays the preferred granularity, but
  deeper nesting (`@pvkit/core/<module>/<theory>/<method>`) works automatically:
  the entry glob (`**`) and the `customExports` key-normalization are both
  depth-agnostic. Use a middle folder only where a model-family groups several
  methods.

## Module boundaries & tests

- **Per-method folder, 4-file set.** Each calculation method lives in its own
  folder `src/models/<module>/<method>/` holding four files plus a method-level
  `index.ts`:
  - `index.ts` — method subpath entry; re-exports the impl (`export * from
    "./<method>.ts"`).
  - `<method>.ts` — implementation.
  - `<method>.md` — theory: source URL(s) of the paper/reference, the
    principle/equations, assumptions, and the stated accuracy tolerance + which
    reference (e.g. pvlib, NREL SPA appendix) the fixtures come from.
  - `<method>.test.ts` — accuracy test: assert against pinned reference outputs
    within a documented tolerance.
  - `<method>.bench.ts` — performance benchmark (per-call timing, regression watch).
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
  shared geo/time types) is imported *upward* by modules. Modules must NOT import
  each other (no `clearsky` → `irradiance`); cross-module relationships are
  data/function pipelines (`solarposition` output → `clearsky`/`irradiance`
  input), not code sharing. Cycles break tree-shaking and the build.

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
   for every energy integral / long reduction. Cheap, pure, zero-dep. Lock this
   into `pvsystem`/`metrics` when they land — do NOT ship a plain
   `reduce((a,b)=>a+b)` for energy totals.
2. **Time stored as float.** A Julian Date is ~2.46e6; float64 leaves ~9 digits
   after the decimal → ms-ish resolution, and *accumulating* JD over decades
   loses sub-second binning. **Fix:** store time as integer ms-epoch (`Date` /
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
- Tests assert documented tolerance, never bit-exact equality; include
  near-horizon angles. Each `<method>.md` states its tolerance + justification.
- No `===`/`!==` on computed floats anywhere.
- Eventually: Hermes in CI.

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
