# pvkit — features checklist

Implementation status, in module dependency order. How to add or change a method:
`AGENTS.md` → "Adding or changing a method".

Legend: `[ ]` todo · `[~]` in progress · `[x]` done + validated.

## 0. Foundation (top-level `src/`, shared by models)

- [x] Branded unit types (`Radians`/`Degrees`, `src/units.ts`)
- [x] API boundary: plain-object inputs (bare `number`, unit by field name) → branded
      returns — a convention (`doc/conventions.md`), no helper needed.
- [x] Compensated summation (`src/sum.ts`) for energy/series reductions
- [x] Constants live with the method that cites them (no shared constants file)
- [x] Shared time/geo convention (`timeMs` UTC, degrees, Pa, °C) — `doc/conventions.md`
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
(measured-series analysis) are not implemented — they need data files / measured series. See
"Not implemented". Air mass lives in `atmosphere`.

## 4. `irradiance` — Perez / Hay-Davies / Isotropic + AOI

Air mass now comes from the `atmosphere` module.

- [x] Angle of incidence (AOI) — sun vs panel surface
- [x] Extraterrestrial radiation helper
- [x] Isotropic diffuse sky transposition
- [x] Hay-Davies diffuse model
- [x] Klucher transposition
- [x] Reindl transposition
- [ ] King transposition — dropped: no peer-reviewed source, deprecated in pvlib 0.16
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
- [x] DIRINT (DISC + 3-hour stability window + dewpoint) — explicit previous/next neighbour inputs
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
- [x] Fuentes (energy-balance) — step function with prior module temperature
- [x] noct_sam (from NOCT rating)
- [x] ross (single-param linear)
- [x] GenericLinearModel (convert coeffs between faiman/pvsyst/sapm/noct — a pvkit differentiator)
- [x] Validation fixtures vs reference

## 8. `tracking` — single-axis tracker geometry

Single-axis tracker geometry. Pure solar geometry — GCR is a scalar param, not a
3D scene, so this is `tracking`, NOT `layout`. High real-world usage (utility-scale PV is
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
- [x] Validation fixtures vs reference (pvlib)

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

## 12–18. Extended modules

- [x] `diode` — single-diode (De Soto / CEC / PVsyst), exact Lambert-W I-V points, SAPM,
      Sandia and ADR inverters
- [x] `layout` — roof fit, min pitch, row-to-row shading, sky masking, partial-shade loss, horizon
- [x] `sizer` — temperature-corrected voltages, NEC 690.7, modules per string
- [x] `economics` — lifetime energy, bill savings, cash flows, NPV, IRR, payback, ROI, LCOE
- [x] `io` — PVGIS TMY and NASA POWER hourly fetch + parse
- [x] `spec` — CEC modules, CEC inverters and Sandia SAPM modules from NREL SAM (data)
- [x] `chain` — ModelChain orchestration (PVWatts model set, fixed tilt)

## Not implemented

| Capability | Why / where it would go |
| --- | --- |
| Spectrum mismatch from reference spectra; ADR inverter coefficient DB; datasheet parsing | `spec`, when asked (`diode/inverter-adr` takes caller-supplied coefficients) |
| Bifacial view factors (`infinite_sheds`), 3-D/obstacle shading, tilt/azimuth optimisation | `layout`, when asked |
| PVGIS hourly series, NSRDB (needs API key), Linke turbidity raster, `detect_clearsky` | `io`, when asked |
| Cold-day Vmp vs `mpptHigh`, NEC 690.8 current/conductor sizing, multi-MPPT, DC/AC ratio | `sizer`, when asked |
| `bishop88` reverse-bias breakdown and thin-film terms, full I-V curve arrays | `diode`, when asked |
| Tracking, other DC/temperature models, spectral loss, Linke lookup in `chain` | `chain`, when asked |
| Taxes, depreciation, loans, monthly net metering, demand charges | out of scope: callers edit the `cashFlows` array |

Skipped for 1.0 entirely: gti_dirint, scaling.wvm (cloud variability), ivtools
(IV-curve fitting), string mismatch, pvfactors (external engine).

## Cross-cutting

- [x] Module subpath `index.ts` re-exports its methods (convenience subpath entry)
- [x] Root entry `src/index.ts` exports unit types only (models via subpaths)
- [x] tsdown generates `package.json` `exports` from the entry glob — `doc/architecture.md` →
      "Subpath exports"
- [x] Tree-shaking guard — `scripts/check-treeshake.mjs` (CI): method entries reach only their module + foundation
- [x] End-to-end pipeline test (`src/pipeline.test.ts`) — sun position → kWh matches pvlib
