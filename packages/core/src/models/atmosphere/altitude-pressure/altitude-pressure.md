# altitude-pressure — standard-atmosphere altitude ↔ pressure

`alt2pres` (metres → Pa) and `pres2alt` (Pa → metres).

## Principle

International standard atmosphere, troposphere: base pressure 101325 Pa, 288.15 K at sea
level, g = 9.80665 m/s², lapse rate −6.5 K/km, R = 287.053 J/(kg·K), dry air:

- `P = 100 · ((44331.514 − h) / 11880.516)^(1 / 0.1902632)`
- `h = 44331.5 − 4946.62 · P^0.190263`

The two use pvlib's (paper's) independently rounded constants, so they are inverse only
to ~0.1 m. Guards: none, as pvlib — `h > 44331.514 m` or `P < 0` → `NaN` (negative base
to a fractional power). Valid range is the troposphere (≲ 11 km); above that the model
is extrapolation.

## Reference

- **Spec:** "A Quick Derivation relating altitude to air pressure", Portland State
  Aerospace Society, v1.03, 2004-12-22, https://www.psas.pdx.edu/RocketScience/PressureAltitude_Derived.pdf.
- **Reference implementation:** `pvlib.atmosphere.alt2pres(altitude)` and
  `pvlib.atmosphere.pres2alt(pressure)` @ pvlib 0.16.1.
- **Fixtures:** `altitude-pressure-fixtures.json` — `alt2pres` 50 cases (−430 m Dead Sea,
  0, 1830 m, Everest, 20 km, 40 km, 42 random −400–6000 m) and `pres2alt` 50 cases (sea
  level, 110 kPa, down to 1 Pa, 42 random 40–108 kPa), from
  `scripts/fixtures/atmosphere-altitude-pressure.py`.
- **Tolerance:** `alt2pres` `1e-12` relative; `pres2alt` `1e-9` m absolute (relative is
  meaningless near 0 m; `4946.62·P^0.19` ≈ 44 000 so 1 ULP ≈ 7e-12 m). Observed max 0 for both
  (bit-identical on V8); the margin absorbs `**` differences across engines.
