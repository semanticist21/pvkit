---
name: roadmap-next
description: Claim the next free item in ROADMAP.md's Queue and build it end to end; safe to run from several agents at once (each takes a different item).
---

# roadmap-next

The Queue table at the top of `ROADMAP.md` is the only work list and the only claim record.
`git push` to `main` is the lock: whoever pushes the claim first owns the item. No branches,
no status files.

## 1. Claim

1. `git pull --rebase origin main`.
2. In the Queue, take the first row whose Status is `todo` and whose "Depends on" rows are
   all `✅`. A `🚧` claim older than 24 h with no commit touching its Path since then is stale:
   treat it as `todo` and say so in your report.
3. Set its Status to `🚧 <UTC yyyy-mm-dd hh:mm> <tag>` (`tag` = `openssl rand -hex 3`, keep it
   for the session), commit only that line as `chore(roadmap): claim #<n> <item>`, push.
4. Push rejected → `git pull --rebase`. If the row now shows someone else's claim, drop
   your edit and go back to step 2. Nothing claimable → report what is claimed or blocked
   (by which dependency) and stop.

## 2. Build

- Follow `AGENTS.md`, `doc/conventions.md`, `doc/architecture.md`. A new package mirrors
  `packages/core`: ESM-only, zero runtime deps, tsdown + vitest, per-method folders,
  method `.md` with `## Reference`, fixtures from a committed generator against an
  established reference (paper, pvlib, NREL SAM, …), README, `AGENTS.md` ≤ 50 lines.
  Extend `harness.config.json` globs and CI to the new path.
- Scope = the item's ROADMAP section. Decide conventional choices yourself; ask one focused
  question (the orchestrator in a multi-agent run, else the user) only for a product choice
  the section leaves genuinely open.
- Commit to `main` in small verified steps and push often; rebase on conflicts, never force.
- Done when `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, the repo's check
  scripts and CI are green.

## 3. Finish

1. Set the row to `✅ <short sha>`; commit `chore(roadmap): done #<n> <item>`; push.
2. Do not publish — releases follow `doc/architecture.md` → "Release procedure" and need
   the user's 2FA.
3. Report what shipped, decisions taken and anything deferred. If the next claimable item
   looks small (well under an hour), claim and build it in the same session; otherwise stop
   so other agents can take items in parallel.
