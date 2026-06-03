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
