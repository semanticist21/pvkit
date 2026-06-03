# @pvkit/core — features checklist

Implementation tracker. Order = dependency order (each builds on prior).
Spec = the paper. Each calculation method ships a co-located 4-file set:
implement `<method>.ts` from the paper → write `<method>.md` (source URL +
principle + the accuracy tolerance and its reference) → pin reference outputs →
assert within that tolerance in `<method>.test.ts` → benchmark in
`<method>.bench.ts`. Accuracy is tolerance-based (JS float64, platform `Math`),
not bit-exact. No core logic without a test.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done + validated.

## 0. Foundation (top-level `src/`, shared by models)

Layout: shared foundation files sit flat at `src/` top; the PV models nest one
layer down under `src/models/<module>/`. Foundation is imported *upward* by models;
models never import each other.

- [x] Branded unit types (`Radians`/`Degrees`, `src/units.ts`)
- [ ] API boundary helper: plain-object inputs (bare `number`, unit by field name)
      → tag to branded internally; returns branded. No forced wrapping by callers.
- [~] Shared physical constants (`src/constants.ts`, stub) — universal physics only;
      model-specific coefficients stay in `src/models/<module>/constants.ts`
- [ ] Shared time/geo types (datetime, lat/lon, elevation, pressure, temp)
      - Standard weather input shape is `{ ghi, dni, dhi, tempAir, windSpeed }`
        (scalar or time-series), so data can come from any source (user CSV, `io`
        pkg, `clearsky`) — core never fetches.
- [ ] Time-series adapter shape (scalar core + thin batch wrapper) — open decision
- [ ] Naming convention locked (camelCase) — open decision

## 1. `solarposition` — NOAA SPA (Reda & Andreas, 2004)

- [ ] Julian date / Julian ephemeris day
- [ ] Earth heliocentric longitude / latitude / radius (L, B, R)
- [ ] Geocentric longitude / latitude
- [ ] Nutation in longitude + obliquity (Δψ, Δε)
- [ ] True obliquity of ecliptic
- [ ] Apparent sun longitude
- [ ] Greenwich / local sidereal time
- [ ] Geocentric sun right ascension + declination
- [ ] Observer local hour angle
- [ ] Topocentric sun right ascension / declination / hour angle
- [ ] Topocentric zenith angle (+ atmospheric refraction correction)
- [ ] Topocentric azimuth angle
- [ ] Topocentric elevation angle
- [ ] Equation of time (spencer / NOAA)
- [ ] Solar hour angle
- [ ] Declination (simple closed-form, Cooper/Spencer)
- [ ] Sunrise / sunset / solar noon (SPA + geometric)
- [ ] Earth-sun distance (AU) for extraterrestrial scaling
- [ ] Validation fixtures vs reference (NREL SPA / pvlib)

## 2. `atmosphere` — closed-form atmospheric helpers

Dataless closed-form helpers consumed by `clearsky` and `irradiance`. Airmass
lives here (moved out of `clearsky`/`irradiance`).

- [ ] Relative air mass (Kasten-Young 1989 + variants)
- [ ] Absolute (pressure-corrected) air mass
- [ ] alt2pres / pres2alt (barometric pressure ↔ altitude)
- [ ] Precipitable water (Gueymard 1994, from T + RH)
- [ ] Linke turbidity / AOD Angstrom helpers (caller-supplied inputs)
- [ ] Validation fixtures vs reference (pvlib)

## 3. `clearsky` — clear-sky irradiance (no measured data)

Depends on `solarposition` + `atmosphere`. Estimates GHI/DNI/DHI under clear sky
— the fallback input when no weather data is fetched. No data round-trip → fits
the browser thesis.

- [ ] Linke turbidity input — **caller input** (constant / lookup)
- [ ] Haurwitz model (GHI only — simplest)
- [ ] Ineichen / Perez clear-sky model (GHI/DNI/DHI)
- [ ] Simplified Solis model (optional)
- [ ] Validation fixtures vs reference (pvlib)

Note: `lookup_linke_turbidity` (bundled climatology raster) and `detect_clearsky`
(measured-series analysis) live in `@pvkit/io`, not core — they need data files /
measured series. Air mass moved to `atmosphere`.

## 4. `irradiance` — Perez / Hay-Davies / Isotropic + AOI

Air mass now comes from the `atmosphere` module.

- [ ] Angle of incidence (AOI) — sun vs panel surface
- [ ] Extraterrestrial radiation helper
- [ ] Isotropic diffuse sky transposition
- [ ] Hay-Davies diffuse model
- [ ] Klucher transposition
- [ ] Reindl transposition
- [ ] King transposition
- [ ] Perez (1990) diffuse model + coefficient lookup
- [ ] Ground-reflected (albedo) component
- [ ] GHI → POA (plane-of-array) total transposition
- [ ] get_total_irradiance (headline entry: GHI/DNI/DHI + geometry → full POA breakdown)
- [ ] poa_components (sum beam + sky-diffuse + ground)
- [ ] Validation fixtures vs reference (pvlib)

## 5. `decomposition` — GHI → DNI/DHI splitters

GHI → DNI/DHI splitters. Essential because real weather feeds (TMY, satellite,
most APIs) often deliver GHI only — without a splitter the transposition→kWh
chain has no beam component.

- [ ] complete_irradiance (closure: fill missing one of GHI/DNI/DHI)
- [ ] Erbs (kt → diffuse fraction, 1982) — the essential cheap splitter
- [ ] Boland (logistic diffuse-fraction)
- [ ] DISC (kt + airmass → DNI)
- [ ] DIRINT (DISC + 3-hour stability window + dewpoint) — needs time-series adapter
- [ ] DIRINDEX (dirint × clearsky ratio)
- [ ] Validation fixtures vs reference (pvlib)

Note: gti_dirint (iterative inverse transposition) deferred to v2.

## 6. `iam` — incidence-angle modifier

Incidence-angle-modifier: AOI reflection/transmission loss. Closed-form, no data.
POA→effective irradiance is incomplete without it.

- [ ] physical (Fresnel/Snell, n/K/L) — default
- [ ] ashrae (b0 single-param)
- [ ] martin_ruiz (a_r param)
- [ ] sapm (polynomial)
- [ ] interp (measured IAM curve)
- [ ] marion_diffuse / marion_integrate (integrate beam-IAM over sky/ground)
- [ ] Validation fixtures vs reference (pvlib)

## 7. `temperature` — cell temperature

- [ ] SAPM cell/module temperature (King, Sandia)
- [ ] PVsyst thermal model (U-value)
- [ ] Faiman model (optional)
- [ ] Fuentes (energy-balance, iterative/prior-timestep — needs time-series adapter)
- [ ] noct_sam (from NOCT rating)
- [ ] ross (single-param linear)
- [ ] GenericLinearModel (convert coeffs between faiman/pvsyst/sapm/noct — a pvkit differentiator)
- [ ] Validation fixtures vs reference

## 8. `tracking` — single-axis tracker geometry

Single-axis tracker geometry. Pure solar geometry — GCR is a scalar param, not a
3D scene, so this is core, NOT layout. High real-world usage (utility-scale PV is
overwhelmingly single-axis).

- [ ] singleaxis (true-tracking rotation, surface tilt/azimuth, AOI)
- [ ] Backtracking (shade-avoiding angle given GCR)
- [ ] calc_axis_tilt (axis tilt from terrain slope)
- [ ] calc_cross_axis_tilt (sloped-terrain cross-axis)
- [ ] Validation fixtures vs reference (pvlib)

## 9. `pvsystem` — PVWatts → kWh

- [ ] DC power (PVWatts model)
- [ ] Temperature derate on DC
- [ ] Inverter model (PVWatts) → AC power
- [ ] Inverter clipping / DC-AC ratio (clamp at Pac0)
- [ ] scale_voltage_current_power (series/parallel string scaling)
- [ ] System losses (soiling, wiring, mismatch, …)
- [ ] Energy integration → kWh
- [ ] Validation fixtures vs reference (NREL PVWatts)

## 10. `losses` — optional derate models

Optional derate models, pure-compute, paper-backed.

- [ ] soiling.kimber (daily accumulation + rain reset) — common default
- [ ] soiling.hsu (HSU PM2.5/PM10 model)
- [ ] combine_loss_factors (join fractional losses)
- [ ] snow coverage + DC loss (Marion NREL) — 1.0-OPTIONAL, geographically niche
- [ ] Validation fixtures vs reference (pvlib)

## 11. `metrics` — IEC 61724-1 performance metrics

IEC 61724-1 performance metrics. Pure arithmetic, standard-backed (IEC 61724 =
the spec).

- [ ] Performance Ratio (PR), IEC 61724-1
- [ ] Specific yield (kWh/kWp)
- [ ] Capacity factor
- [ ] Availability
- [ ] Validation fixtures vs reference

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

- [ ] Module subpath `index.ts` re-exports its methods (convenience subpath entry)
- [ ] Root entry `src/index.ts` re-exports submodules + unit types
- [x] Wildcard `package.json` exports + glob tsdown entry — new method/module
      files need no manual wiring (method = zero edits; new module = one
      method-wildcard line). See `doc/architecture.md` → "Subpath exports".
- [ ] Tree-shaking guard (function-level exports, `sideEffects: false`)
