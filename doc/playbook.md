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
publishing — `.js` resolving does not mean `.d.ts` resolves.
