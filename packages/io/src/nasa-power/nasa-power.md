# nasa-power — NASA POWER hourly point data

`getNasaPower` requests the POWER hourly point API with pvlib's exact query
(`community`, `parameters`, `format=json`, `header=True`, `time-standard=utc`, optional
`site-elevation`, `wind-elevation`, `wind-surface`); `start`/`end` are the UTC dates of
`startMs`/`endMs`, end inclusive. POWER sends CORS headers, so it works from a browser.

`parameters` take pvkit names (`NASA_POWER_PARAMETERS` = pvlib `VARIABLE_MAP`, camelCased).
Parsing, as pvlib `get_nasa_power(map_variables=True)`:

- keys `YYYYMMDDHH` → `timeMs` (UTC, interval start);
- `header.fill_value` (−999) → `NaN`;
- `PS` kPa → Pa (×1000); `TQV` kg/m² → cm (×0.1);
- irradiance is the hour's mean (POWER reports Wh/m² per hour = W/m²).

`meta` is the grid cell POWER answered for (`geometry.coordinates`), not the request point.

## Reference

1. Spec — NASA POWER API (hourly point) and parameter definitions:
   https://power.larc.nasa.gov/api/pages/ , https://power.larc.nasa.gov/parameters/ ;
   Stackhouse et al., "POWER Release 9 Methodology", NASA LaRC.
2. Reference implementation — `pvlib.iotools.get_nasa_power` @ pvlib 0.16.1, with
   `requests.get` stubbed to return the captured response.
3. Fixtures — `scripts/fixtures/io.py` → `nasa-power-fixtures.json` from
   `nasa-power-raw.json` (a real Seoul response spanning 2024-02-28…03-01, leap day included;
   one `T2M` value set to the fill value). Query compared exactly; values to 1e-9 (only
   `pressure` involves arithmetic: one multiply, ≤ 1 ulp).
