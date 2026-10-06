# model-chain — PVWatts ModelChain for one instant

## Principle

pvlib `ModelChain` with PVWatts DC/AC/losses models, one timestamp per call. Transposition
defaults to Hay–Davies (the plain `ModelChain` default; `with_pvwatts` would use Perez).

1. Sun: NREL SPA, pressure `alt2pres(altitude)`, refraction at the step's `tempAir`, or
   12 °C when it is omitted (ModelChain passes only the caller's `temp_air` to
   `Location.get_solarposition`, whose default is 12 °C).
2. Air mass: Kasten–Young 1989 on apparent zenith; absolute with the same pressure.
3. Sky: measured `weather`, or Ineichen clear sky with `linkeTurbidity` and Spencer
   extraterrestrial DNI (pvlib `Location.get_clearsky` on that sun position).
4. POA: `totalIrradiance` (default Hay–Davies) on apparent zenith.
5. `effectiveIrradiance = poaDirect · IAM_physical(aoi) + poaDiffuse` (no spectral loss).
6. Cell temperature: SAPM on `poaGlobal` (default open rack, glass/glass).
7. `pdc = pvwattsDc · (1 − pvwattsLosses)`; `pac = pvwattsInverter(pdc)`.

Defaults follow ModelChain (cell temperature at `tempAir` 20 °C, `windSpeed` 0, albedo
0.25, η 0.96). Passing neither `weather` nor a finite `linkeTurbidity` throws `RangeError`.
`inverterPdc0` defaults to `pdc0 / 1.2 / etaInvNom` — PVWatts' DC/AC ratio 1.2, so the AC
limit is `pdc0 / 1.2`. Fixed tilt only.

## Reference

- **Spec:** the composed methods' papers (each `@pvkit/core` method note); orchestration
  per Dobos 2014, PVWatts Version 5 Manual, NREL/TP-6A20-62641, doi:10.2172/1158421,
  https://www.nrel.gov/docs/fy14osti/62641.pdf.
- **Reference implementation:** pvlib 0.16.1 `pvlib.modelchain.ModelChain` (aoi "physical",
  spectral "no_loss", dc/ac/losses "pvwatts", temperature "sapm"), ΔT pinned to 67 s.
- **Fixtures:** `model-chain-fixtures.json` from `scripts/fixtures/chain-model-chain.py`,
  168 steps: Seoul clear-sky summer day (no `temp_air`/`wind_speed`, so ModelChain's
  defaults; horizon crossings), Tromsø leap day
  (polar low sun, measured-style weather, Perez, custom losses/temperature/inverter),
  Sydney north-facing solstice (isotropic).
- **Tolerance:** `1e-9` relative (floor 1) on every output — the composed methods' own
  1e-9…1e-12 tolerances. Observed max: 2.1e-14.
