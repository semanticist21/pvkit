# @pvkit/core — features checklist

Implementation tracker. Order = dependency order (each builds on prior).
Spec = the paper. Each model: implement from paper → pin reference outputs as
fixtures → assert in `*.test.ts`. No core logic without a test.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done + validated.

## 0. Foundation (top-level `src/`, shared by models)

Layout: shared foundation files sit flat at `src/` top; the 5 PV models nest one
layer down under `src/models/<module>/`. Foundation is imported *upward* by models;
models never import each other.

- [x] Branded unit types (`Radians`/`Degrees`, `src/units.ts`)
- [ ] API boundary helper: plain-object inputs (bare `number`, unit by field name)
      → tag to branded internally; returns branded. No forced wrapping by callers.
- [~] Shared physical constants (`src/constants.ts`, stub) — universal physics only;
      model-specific coefficients stay in `src/models/<module>/constants.ts`
- [ ] Shared time/geo types (datetime, lat/lon, elevation, pressure, temp)
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
- [ ] Validation fixtures vs reference (NREL SPA / pvlib)

## 2. `clearsky` — clear-sky irradiance (no measured data)

Depends only on `solarposition`. Estimates GHI/DNI/DHI under clear sky — the
fallback input when no weather data is fetched. No data round-trip → fits the
browser thesis.

- [ ] Relative + absolute air mass (Kasten-Young)
- [ ] Linke turbidity input (constant / lookup)
- [ ] Haurwitz model (GHI only — simplest)
- [ ] Ineichen / Perez clear-sky model (GHI/DNI/DHI)
- [ ] Simplified Solis model (optional)
- [ ] Validation fixtures vs reference (pvlib)

## 3. `irradiance` — Perez / Hay-Davies / Isotropic + AOI

- [ ] Angle of incidence (AOI) — sun vs panel surface
- [ ] Extraterrestrial radiation helper (air mass lives in `clearsky`)
- [ ] Isotropic diffuse sky transposition
- [ ] Hay-Davies diffuse model
- [ ] Perez (1990) diffuse model + coefficient lookup
- [ ] Ground-reflected (albedo) component
- [ ] GHI → POA (plane-of-array) total transposition
- [ ] Validation fixtures vs reference (pvlib)

## 4. `temperature` — cell temperature

- [ ] SAPM cell/module temperature (King, Sandia)
- [ ] PVsyst thermal model (U-value)
- [ ] Faiman model (optional)
- [ ] Validation fixtures vs reference

## 5. `pvsystem` — PVWatts → kWh + metrics

- [ ] DC power (PVWatts model)
- [ ] Temperature derate on DC
- [ ] Inverter model (PVWatts) → AC power
- [ ] System losses (soiling, wiring, mismatch, …)
- [ ] Energy integration → kWh
- [ ] Performance Ratio (PR) — actual yield / reference yield (IEC 61724)
- [ ] Specific yield (kWh/kWp), capacity factor
- [ ] Validation fixtures vs reference (NREL PVWatts)

## Cross-cutting

- [ ] Per-submodule subpath `index.ts` re-exports
- [ ] Add each submodule entry to `tsdown.config.ts`
- [ ] Root entry `src/index.ts` re-exports submodules + unit types
- [ ] Tree-shaking guard (function-level exports, `sideEffects: false`)
