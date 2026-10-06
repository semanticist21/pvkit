# absolute-airmass — pressure-adjusted air mass

## Principle

`AMa = AMr · P / 101325`, with `AMr` the relative air mass at sea level and `P` the site
pressure in Pa (default 101325). Unitless. No guards (pvlib has none).

## Reference

- **Spec:** C. Gueymard, "Critical analysis and performance assessment of clear sky solar
  irradiance models using theoretical and measured data", *Sol. Energy* 51:121–138, 1993,
  doi:10.1016/0038-092X(93)90074-X.
- **Reference implementation:** `pvlib.atmosphere.get_absolute_airmass(airmass_relative,
  pressure)` @ pvlib 0.16.1.
- **Fixtures:** `absolute-airmass-fixtures.json` (50 cases: sea level, horizon AM 37.92,
  zero pressure, high-altitude and >1 atm pressures, 44 random AM 1–38 × 50–108 kPa), from
  `scripts/fixtures/atmosphere-absolute-airmass.py`.
- **Tolerance:** `1e-12` absolute. Observed max 0 (bit-identical). One multiply and one divide,
  identical operation order to pvlib.
