# pvkit roadmap

> `@pvkit/core` 0.1.0 released. The queue below is the agreed order; the sections after it
> describe each package. Agents take work with the `roadmap-next` skill.

## Queue

`Status`: `todo` · `🚧 <UTC time> <agent tag>` (claimed) · `✅ <commit>` (done, unpublished
until the user releases it). Claims are made only by committing this table to `main`.

| # | Item | Path | Depends on | Status |
| --- | --- | --- | --- | --- |
| 1 | demo site — browser kWh estimate on `@pvkit/core` | `apps/demo` | — | ✅ 5b81b1d |
| 2 | `@pvkit/chain` — ModelChain-style orchestration | `packages/chain` | — | 🚧 2026-10-06 04:30 93b71f |
| 3 | `@pvkit/economics` — LCOE, payback, ROI, degradation | `packages/economics` | — | 🚧 2026-10-06 04:30 483013 |
| 4 | `@pvkit/spec` — module/inverter spec schema + data | `packages/spec` | — | ✅ 0034fe3 |
| 5 | `@pvkit/sizer` — string sizing, over-voltage checks | `packages/sizer` | 4 | todo |
| 6 | `@pvkit/io` — PVGIS / NASA POWER weather fetch | `packages/io` | — | 🚧 2026-10-06 04:36 b89a5d |
| 7 | `@pvkit/layout` — roof placement, shading | `packages/layout` | — | todo |
| 8 | `@pvkit/diode` — single-diode electrical models | `packages/diode` | 4 | todo |

## Confirmed

| Package | Description |
| --- | --- |
| `@pvkit/core` | PV modeling core. solarposition · atmosphere · clearsky · irradiance · decomposition · iam · temperature · tracking · pvsystem · losses · metrics. Produces kWh. PVWatts-path precision (single-diode/SAPM precision lives in separate packages). |
| `@pvkit/sizer` | String sizing. Series/parallel panel configuration. Inverter over-voltage safety; a gap in JS tooling. |

## Under review (considered instead of react)

`@pvkit/react` (realtime hooks) is deprioritized — the candidates below are
stronger on both frontend usefulness and differentiation.

### Priority 1 — `@pvkit/economics` (financial modeling) ★ likely

A solar quote/estimate calculator is the #1 solar-web-app type, yet there is no
JS library for it.

- LCOE, payback period, ROI
- 25-year energy yield with annual degradation, accumulated
- Bill-savings, self-consumption vs. export, incentives
- Pure computation → runs directly in the browser (a quote page is naturally
  client-side)
- Plugs cleanly into `core`: kWh → economics ($)

→ More frontend-useful than react. Quote calculators want client-side compute
for good UX. Strong differentiation (open space).

### Priority 2 — `@pvkit/io` (weather / irradiance data)

Fetch TMY / weather data from PVGIS · NASA POWER · NSRDB, etc.

- Genuinely open space, clear demand (modeling needs weather data first)
- Downside: CORS / API-key constraints make it server-leaning → slightly off the
  "frontend-useful" thesis

### Priority 3 — `@pvkit/layout` (placement / shading)

Roof area → panel count, tilt/azimuth optimization, shading / horizon analysis.

- Visual → fits the frontend well
- Downside: 3D / geometry is heavy. High implementation difficulty, a burden for 1.0

### Priority 4 — `@pvkit/spec` (datasheet parser / DB)

Normalize panel / inverter specs. Consumed by `sizer` and `diode`.

- Useful, but mostly data-curation grind. More dataset than library

### Deferred / advanced packages

| Package | Description |
| --- | --- |
| `@pvkit/diode` | Precise single-diode + SAPM electrical models (desoto/cec/pvsyst calcparams, single-diode solver, SAPM I-V, Sandia/ADR inverters). Depends on core + spec (parameter DBs). Out of 1.0 — most real work is covered by core's PVWatts path. |
| `@pvkit/chain` | Thin orchestration layer wiring solarposition→irradiance→temperature→pvsystem with sane defaults (pvlib ModelChain analog). Kept out of core to keep core stateless and tree-shakable. |

## Dependency graph (expected)

```
io ──► core (kWh) ──┬─► economics ($)
                    ├─► chain (orchestration)
                    ├─► layout
                    ├─► diode ◄── spec
                    └─► sizer ◄── spec
```
