# king — King empirical sky diffuse

## Principle

`poaSkyDiffuse = max(dhi (1 + cos β)/2 + ghi (0.012 z − 0.04)(1 − cos β)/2, 0)`, z in
degrees: isotropic sky plus an empirical zenith-dependent ground/horizon term fitted by
D. L. King (Sandia). pvlib 0.16 deprecates `king` (removal planned in 0.17); kept here for
parity with the transposition-model set.

## Reference

- **Spec:** D. L. King, Sandia National Laboratories, unpublished model as documented in the
  PVPMC/pvlib model reference ("King diffuse model"),
  https://pvpmc.sandia.gov/modeling-guide/1-weather-design-inputs/plane-of-array-poa-irradiance/calculating-poa-irradiance/poa-sky-diffuse/.
- **Reference implementation:** `pvlib.irradiance.king` @ pvlib 0.16.1.
- **Fixtures:** `king-fixtures.json` — the shared transposition scenario set (see
  `../irradiance.md`).
- **Tolerance:** `1e-12` relative to `max(1, |expected|)` W/m². Observed max error: 1.4e-16 (relative; non-finite outcomes match exactly).
