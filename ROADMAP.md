# pvkit roadmap

> The queue below is the agreed order; agents take work with the `roadmap-next` skill. Release
> status per package: `README.md` "Packages"; each package's deferred scope: its `AGENTS.md`.

## Queue

`Status`: `todo` · `🚧 <UTC time> <agent tag>` (claimed) · `✅ <commit>` (done, unpublished
until the user releases it). Claims are made only by committing this table to `main`.

| # | Item | Path | Depends on | Status |
| --- | --- | --- | --- | --- |
| 1 | demo site — browser kWh estimate on `@pvkit/core` | `apps/demo` | — | ✅ 5b81b1d |
| 2 | `@pvkit/chain` — ModelChain-style orchestration | `packages/chain` | — | ✅ 33480bb |
| 3 | `@pvkit/economics` — LCOE, payback, ROI, degradation | `packages/economics` | — | ✅ 46e1dae |
| 4 | `@pvkit/spec` — module/inverter spec schema + data | `packages/spec` | — | ✅ 0034fe3 |
| 5 | `@pvkit/sizer` — string sizing, over-voltage checks | `packages/sizer` | 4 | ✅ 27395d0 |
| 6 | `@pvkit/io` — PVGIS / NASA POWER weather fetch | `packages/io` | — | ✅ 257bd37 |
| 7 | `@pvkit/layout` — roof placement, shading | `packages/layout` | — | ✅ c71833a |
| 8 | `@pvkit/diode` — single-diode electrical models | `packages/diode` | 4 | ✅ 577197b |

## Not queued

- `@pvkit/react` (realtime hooks) — deprioritized; queue it here with a scope section before
  anyone builds it.
