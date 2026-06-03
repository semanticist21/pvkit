# doc/ — durable engineering docs

Home for context that must survive across agent sessions. The harness
(`scripts/agent-harness-check.mjs`) nudges toward keeping these current when
source under a `durableSourceGlob` changes.

## Where things go

| Kind | Location |
| --- | --- |
| **Base skeleton** — architecture, module plan, design decisions | `doc/architecture.md`, package `AGENTS.md` |
| **Gotchas / mistakes / surprises** — things a future session would trip on | `doc/playbook.md` (append-only log) |
| **Plans** — scoped work-in-progress notes | `doc/plan/` |
| **Agent instructions** — how to work in this repo | root `AGENTS.md` (`CLAUDE.md` symlink) |

## The accumulation loop

The harness check is a *passive reminder* — it cannot write docs itself. The
loop is: change source → harness reminds at commit/handoff → **you** record the
durable bit. Skeleton edits land in `architecture.md`/`AGENTS.md`; every gotcha
or wrong turn gets one line in `playbook.md` so it is never re-learned.
