# Playbook — gotchas, mistakes, surprises

Append-only. One entry per thing a future session would otherwise re-learn the
hard way. Format:

```
## YYYY-MM-DD — <short title>
**Trap:** what bit / what was assumed.
**Truth:** what is actually true.
**Apply:** what to do next time.
```

Keep entries terse. Promote anything that becomes a permanent rule into
`architecture.md` or the relevant `AGENTS.md`.

---

## 2026-06-03 — harness ≠ auto-writer
**Trap:** assumed the agent harness automatically generates/accumulates docs.
**Truth:** `scripts/agent-harness-check.mjs` is a passive reminder — it only
warns at commit/handoff when source changed without a touched test/doc. It never
writes files.
**Apply:** treat the warn as a prompt to hand-record durable context — skeleton
in `architecture.md`/`AGENTS.md`, gotchas here. `docFileNames` includes
`playbook.md`, so updating this file satisfies the durable-doc check.

## 2026-06-03 — test-pairing is per-module, keyed by path
**Trap:** assumed any changed test file satisfies the test-pairing check (it was
global once). Also assumed a file directly under `src/` is keyed by its folder.
**Truth:** `testPairingMode: "module"` keys each file via `moduleKey()` —
`<root><submodule-dir>` for nested files, else `<root><filename-stem>` (with
`.test`/`.spec` stripped) so `units.ts` pairs only with `units.test.ts`. A file
outside `modulePairingRoot` keys to `null` and falls back to the global check
(never silently exempt). No config-supplied regex is compiled, so a bad config
can't throw and break the pre-commit/Stop hook.
**Apply:** to add a paired test, put it in the same module dir (or same stem for
top-level files). Don't reintroduce a config `moduleKeyRegex` — the path-split
keying is deliberate to avoid the null-key regression and the regex-throw risk.

## 2026-06-03 — method layout flipped: flat co-located → per-method folder
**Trap:** docs had locked "flat 4-file set co-located in `src/models/<module>/`"
(`spa.ts`/`spa.md`/`spa.test.ts`/`spa.bench.ts` all in the module dir). Owner's
prior intent was actually a **folder per method**; flat crowds a module dir
(method×4 files).
**Truth:** locked layout is now `src/models/<module>/<method>/` holding
`index.ts` (subpath entry, re-exports impl) + the 4-file set. Public import
`@pvkit/core/<module>/<method>` resolves to `<method>/index.ts`. Wiring touched:
`package.json` `exports` + `publishConfig` method wildcards changed
`*.ts`/`*.d.ts`/`*.js` → `*/index.ts` / `*/index.{d.ts,js}` (11 modules ×2
blocks). tsdown entry UNCHANGED — `src/models/**/*.ts` `**` already reaches into
method folders. Harness pairing UNCHANGED — `moduleKey()` splits on the FIRST
path segment under `modulePairingRoot`, so every file under `models/` keys to the
single `models` bucket; method-folder depth is invisible to it (was already
coarse at the flat layout too).
**Apply:** a new method = a new folder with its own `index.ts`; no config edit.
Don't "fix" tsdown or harness config for the folder depth — both are already
depth-agnostic. If you ever want finer test pairing than the `models` bucket,
that's a `moduleKey()` change, separate from this layout.

## 2026-06-03 — float64 is enough; the bites are accumulation/time/platform, not precision
**Trap:** instinct to "fix" JS numeric limits with a decimal/BigInt lib before
implementing SPA, fearing float64 can't match the C/Python reference accuracy.
**Truth:** JS `number` IS C `double` IS Python `float` (IEEE 754, ~15–16 digits)
— pvkit matches pvlib/NREL natively; precision floor is a non-issue (input data
is ±2–5%, ~13 orders above float noise). The real production failures are
elsewhere and all have zero-dep fixes: (1) time-series sum error → Kahan/Neumaier
summation for energy totals; (2) JD stored as float loses sub-second → store
integer ms-epoch, derive JD at use-site; (3) near-horizon cancellation → clamp +
test the hard angles; (4) large-arg trig → `limitDegrees`/`limitRadians` before
sin/cos; (5) engine ULP differences → tolerance asserts, never `===` on floats;
(6) Hermes/RN differs → eventually test on Hermes.
**Apply:** never add a bignum dep (breaks zero-dep, gains nothing). Full rationale
+ rules in `doc/architecture.md` → "Numerical strategy — float64, zero deps".
`limitDegrees`/`limitRadians` already live in `src/units.ts`; use them before any
trig on an accumulated angle.

## 2026-06-03 — tsdown hashes .d.ts entry names; publishConfig expects fixed paths
**Trap:** tsdown's default `hash: true` appends a content hash to chunk filenames.
The `.js` *entries* stay unhashed (`dist/models/<m>/index.js`) but the `.d.ts`
*entries* came out hashed (`index-EZSp20FO.d.ts`), while `publishConfig.exports`
`types` point at the fixed `./dist/models/<m>/index.d.ts`. Result: a published
package resolves runtime but NOT types — silent for a 0.0.0 unpublished package,
fatal for a type-first library at first publish.
**Truth:** verified empirically — with default `hash: true`, tsdown leaves `.js`
*entries* unhashed (`index.js`) but hashes the shared chunk (`chunk-XXXX.js`) AND
hashes every `.d.ts` *entry* (`index-XXXX.d.ts`). The asymmetry (js entry stable,
dts entry hashed) is the bug. Fix: `hash: false` → both `.js` and `.d.ts` entries
stable, shared chunk becomes plain `chunk.js`. Hashing entry filenames is
pointless for an npm library (consumers re-bundle; cache-busting is the app's job,
and the package version already versions the artifact); it actively hurts because
`package.json` exports reference fixed paths that hashing would invalidate every
content change.
**Apply:** keep `hash: false`. If you re-enable hashing or swap bundlers, re-verify
every `publishConfig.exports` `types`/`default` path exists in `dist` before
publishing — `.js` resolving does not mean `.d.ts` resolves. (`hash: false` now
also keeps the tsdown-generated exports paths stable — see the 2026-06-03 exports
entry below.)

## 2026-06-03 — exports: switched from hand-wildcards to tsdown-generated
**Trap:** hand-authored wildcard `exports` (`"./*"` / `"./<module>/*"`) drift from
real `dist` output — they can leak impl files as public subpaths and need a
recurring `moduleResolution: bundler` footgun audit, and `publishConfig` had to be
mirrored by hand.
**Truth:** set `exports: { devExports: true, customExports }` in
`tsdown.config.ts`. tsdown writes `exports` (→ `src`) + `publishConfig.exports`
(→ `dist`) + `main`/`module`/`types` from the entry glob on every build.
`customExports` strips the `models/` prefix, collapses the trailing `/index`, and
keeps ONLY each folder's `index` entry — so per-method impl files stay private.
Net public shape is unchanged: `@pvkit/core/<module>` and `<module>/<method>`.
Supersedes the earlier hand-written "wildcard exports" approach.
**Apply:** treat `package.json` `exports`/`publishConfig`/`main`/`module`/`types`
as GENERATED — never hand-edit. Run `bun run build` after changing the
module/method set and commit the regenerated `package.json` (pre-commit runs
biome/tsgo/harness, NOT build, so a stale map won't be caught). Keep `hash: false`
so the generated dist paths stay stable.
