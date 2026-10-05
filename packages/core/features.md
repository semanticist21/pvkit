# @pvkit/core — features checklist

Implementation tracker. Order = dependency order (each builds on prior).
Spec = the paper. Each calculation method is its own folder
`src/models/<module>/<method>/` holding a method `index.ts` (subpath entry,
re-exports the impl) plus its file set: implement `<method>.ts` from the paper →
write `<method>.md` (principle + `## Reference`) → generate fixture JSON with
`scripts/fixtures/<module>-<method>.py` → assert within tolerance in
`<method>.test.ts` → optional `<method>.bench.ts` for perf-critical methods. Public import
`@pvkit/core/<module>/<method>` resolves to `<method>/index.ts`. Accuracy is
tolerance-based (JS float64, platform `Math`), not bit-exact. No core logic
without a test.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done + validated.

## 0. Foundation (top-level `src/`, shared by models)

Layout: shared foundation files sit flat at `src/` top; the PV models nest one
layer down under `src/models/<module>/`. Foundation is imported *upward* by models;
models never import each other.

- [x] Branded unit types (`Radians`/`Degrees`, `src/units.ts`)
- [x] API boundary: plain-object inputs (bare `number`, unit by field name) → branded
      returns — a convention (`doc/conventions.md`), no helper needed.
- [x] Compensated summation (`src/sum.ts`) for energy/series reductions
- [x] Constants live with the method that cites them (no shared constants file)
- [x] Shared time/geo convention (`timeMs` UTC, degrees, Pa, °C) — `doc/conventions.md`
      - Standard weather input shape is `{ ghi, dni, dhi, tempAir, windSpeed }`
        (scalar or time-series), so data can come from any source (user CSV, `io`
        pkg, `clearsky`) — core never fetches.
- [x] Time-series adapter shape — scalar core locked; batch adapter on demand (`doc/conventions.md`)
- [x] Naming convention locked (camelCase)

## 1. `solarposition` — NREL SPA (Reda & Andreas, 2004) — `spa` ✓

- [x] Julian date / Julian ephemeris day
- [x] Earth heliocentric longitude / latitude / radius (L, B, R)
- [x] Geocentric longitude / latitude
- [x] Nutation in longitude + obliquity (Δψ, Δε)
- [x] True obliquity of ecliptic
- [x] Apparent sun longitude
- [x] Greenwich / local sidereal time
- [x] Geocentric sun right ascension + declination
- [x] Observer local hour angle
- [x] Topocentric sun right ascension / declination / hour angle
- [x] Topocentric zenith angle (+ atmospheric refraction correction)
- [x] Topocentric azimuth angle
- [x] Topocentric elevation angle
- [x] Equation of time (SPA in `spa`; spencer71 / pvcdrom simple forms)
- [x] Solar hour angle
- [x] Declination (simple closed-form, Cooper/Spencer)
- [x] Sunrise / sunset / solar noon (SPA + geometric)
- [x] Earth-sun distance (AU) for extraterrestrial scaling
- [x] Validation fixtures vs reference (NREL SPA / pvlib)

## 2. `atmosphere` — closed-form atmospheric helpers

Dataless closed-form helpers consumed by `clearsky` and `irradiance`. Airmass
lives here (moved out of `clearsky`/`irradiance`).

- [x] Relative air mass (Kasten-Young 1989 + variants)
- [x] Absolute (pressure-corrected) air mass
- [x] alt2pres / pres2alt (barometric pressure ↔ altitude)
- [x] Precipitable water (Gueymard 1994, from T + RH)
- [x] Linke turbidity / AOD Angstrom helpers (caller-supplied inputs)
- [x] Validation fixtures vs reference (pvlib)

## 3. `clearsky` — clear-sky irradiance (no measured data)

Depends on `solarposition` + `atmosphere`. Estimates GHI/DNI/DHI under clear sky
— the fallback input when no weather data is fetched. No data round-trip → fits
the browser thesis.

- [x] Linke turbidity input — **caller input** (constant / lookup)
- [x] Haurwitz model (GHI only — simplest)
- [x] Ineichen / Perez clear-sky model (GHI/DNI/DHI)
- [x] Simplified Solis model (optional)
- [x] Validation fixtures vs reference (pvlib)

Note: `lookup_linke_turbidity` (bundled climatology raster) and `detect_clearsky`
(measured-series analysis) live in `@pvkit/io`, not core — they need data files /
measured series. Air mass moved to `atmosphere`.

## 4. `irradiance` — Perez / Hay-Davies / Isotropic + AOI

Air mass now comes from the `atmosphere` module.

- [x] Angle of incidence (AOI) — sun vs panel surface
- [x] Extraterrestrial radiation helper
- [x] Isotropic diffuse sky transposition
- [x] Hay-Davies diffuse model
- [x] Klucher transposition
- [x] Reindl transposition
- [x] King transposition
- [x] Perez (1990) diffuse model + coefficient lookup
- [x] Ground-reflected (albedo) component
- [x] GHI → POA (plane-of-array) total transposition
- [x] get_total_irradiance (headline entry: GHI/DNI/DHI + geometry → full POA breakdown)
- [x] poa_components (sum beam + sky-diffuse + ground)
- [x] Validation fixtures vs reference (pvlib)

## 5. `decomposition` — GHI → DNI/DHI splitters

GHI → DNI/DHI splitters. Essential because real weather feeds (TMY, satellite,
most APIs) often deliver GHI only — without a splitter the transposition→kWh
chain has no beam component.

- [x] complete_irradiance (closure: fill missing one of GHI/DNI/DHI)
- [x] Erbs (kt → diffuse fraction, 1982) — the essential cheap splitter
- [x] Boland (logistic diffuse-fraction)
- [x] DISC (kt + airmass → DNI)
- [x] DIRINT (DISC + 3-hour stability window + dewpoint) — needs time-series adapter
- [x] DIRINDEX (dirint × clearsky ratio)
- [x] Validation fixtures vs reference (pvlib)

Note: gti_dirint (iterative inverse transposition) deferred to v2.

## 6. `iam` — incidence-angle modifier

Incidence-angle-modifier: AOI reflection/transmission loss. Closed-form, no data.
POA→effective irradiance is incomplete without it.

- [x] physical (Fresnel/Snell, n/K/L) — default
- [x] ashrae (b0 single-param)
- [x] martin_ruiz (a_r param)
- [x] sapm (polynomial)
- [x] interp (measured IAM curve) — linear only; quadratic/cubic need scipy splines
- [x] marion_diffuse / marion_integrate (integrate beam-IAM over sky/ground)
- [x] Validation fixtures vs reference (pvlib)

## 7. `temperature` — cell temperature

- [x] SAPM cell/module temperature (King, Sandia)
- [x] PVsyst thermal model (U-value)
- [x] Faiman model (optional)
- [x] Fuentes (energy-balance, iterative/prior-timestep — needs time-series adapter)
- [x] noct_sam (from NOCT rating)
- [x] ross (single-param linear)
- [x] GenericLinearModel (convert coeffs between faiman/pvsyst/sapm/noct — a pvkit differentiator)
- [x] Validation fixtures vs reference

## 8. `tracking` — single-axis tracker geometry

Single-axis tracker geometry. Pure solar geometry — GCR is a scalar param, not a
3D scene, so this is core, NOT layout. High real-world usage (utility-scale PV is
overwhelmingly single-axis).

- [x] singleaxis (true-tracking rotation, surface tilt/azimuth, AOI)
- [x] Backtracking (shade-avoiding angle given GCR)
- [x] calc_axis_tilt (axis tilt from terrain slope)
- [x] calc_cross_axis_tilt (sloped-terrain cross-axis)
- [x] Validation fixtures vs reference (pvlib)

## 9. `pvsystem` — PVWatts → kWh

- [x] DC power (PVWatts model)
- [x] Temperature derate on DC
- [x] Inverter model (PVWatts) → AC power
- [x] Inverter clipping / DC-AC ratio (clamp at Pac0)
- [x] scale_voltage_current_power (series/parallel string scaling)
- [x] System losses (soiling, wiring, mismatch, …)
- [x] Energy integration → kWh
- [x] Validation fixtures vs reference (NREL PVWatts)

## 10. `losses` — optional derate models

Optional derate models, pure-compute, paper-backed.

- [x] soiling.kimber (daily accumulation + rain reset) — common default
- [x] soiling.hsu (HSU PM2.5/PM10 model)
- [x] combine_loss_factors (join fractional losses)
- [ ] snow coverage + DC loss (Marion NREL) — skipped for 1.0 (optional, geographically niche)
- [x] Validation fixtures vs reference (pvlib)

## 11. `metrics` — IEC 61724-1 performance metrics

IEC 61724-1 performance metrics. Pure arithmetic, standard-backed (IEC 61724 =
the spec).

- [x] Performance Ratio (PR), IEC 61724-1
- [x] Specific yield (kWh/kWp)
- [x] Capacity factor
- [x] Availability
- [x] Validation fixtures vs reference

## Out of core scope (separate packages)

| Capability | Goes to | Why not core |
| --- | --- | --- |
| single-diode (desoto/cec/pvsyst), single-diode solver (Lambert-W/bishop88), max_power_point, i↔v | `@pvkit/diode` (proposed) | pure TS but inert without per-module parameters; gateway to data-bound models |
| SAPM full I-V, Sandia/ADR inverter models | `@pvkit/diode` | DB-coefficient driven |
| Parameter databases (CEC ~20k modules, CEC inverters, Sandia) | `@pvkit/spec` | multi-MB data — breaks zero-data core |
| Spectrum mismatch (firstsolar/sapm, AM1.5 reference) | `@pvkit/spec` | reference-spectrum tables = data |
| Bifacial (infinite_sheds, pvfactors) + row/horizon shading | `@pvkit/layout` | row/tracker 3D geometry + view factors |
| iotools (TMY/EPW/PVGIS/NSRDB/NASA fetch + parse) | `@pvkit/io` | network + file parsing breaks zero-runtime-dep |
| ModelChain orchestrator + PVSystem/Array/Location classes | `@pvkit/chain` (thin layer) | encodes model-choice opinions + mutable state + time-series shape; core stays stateless |

Skipped for 1.0 entirely: gti_dirint, scaling.wvm (cloud variability), ivtools
(IV-curve fitting), string mismatch, pvfactors (external engine).

## Cross-cutting

- [x] Module subpath `index.ts` re-exports its methods (convenience subpath entry)
- [x] Root entry `src/index.ts` re-exports submodules + unit types
- [x] tsdown generates `package.json` `exports`/`publishConfig` (+ main/module/
      types) from the glob tsdown entry on build — new method/module files need no
      manual wiring; run `pnpm build` to regenerate after adding a method/module
      and commit the result. Per-method impl files stay private via `customExports`.
      See `doc/architecture.md` → "Subpath exports".
- [x] Tree-shaking guard — `scripts/check-treeshake.mjs` (CI): method entries reach only their module + foundation
- [x] End-to-end pipeline test (`src/pipeline.test.ts`) — sun position → kWh matches pvlib
