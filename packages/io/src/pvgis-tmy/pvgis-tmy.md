# pvgis-tmy — PVGIS typical meteorological year

`getPvgisTmy` requests `GET <url>?lat&lon&outputformat=json[&usehorizon=0][&startyear][&endyear]`
and `parsePvgisTmy` maps the response:

| PVGIS | pvkit | unit |
| --- | --- | --- |
| `time(UTC)` `YYYYMMDD:HHMM` | `timeMs` | UTC epoch ms, hour start |
| `G(h)` / `Gb(n)` / `Gd(h)` | `ghi` / `dni` / `dhi` | W/m² |
| `IR(h)` | `longwaveDown` | W/m² |
| `T2m` | `tempAir` | °C |
| `RH` | `relativeHumidity` | % |
| `WS10m` / `WD10m` | `windSpeed` / `windDirection` | m/s / ° from N |
| `SP` | `pressure` | Pa |

A TMY stitches each calendar month from a different source year (`meta.monthsSelected`), so
every row is restamped to `coerceYear` (default 1990, as pvlib). A Feb 29 row that does not
exist in `coerceYear` throws, as pvlib's `Timestamp.replace` does. pvlib's optional
`roll_utc_offset` (shift to local standard time) is not offered — pvkit time is UTC.

PVGIS 5.3 reports `inputs.location.irradiance_time_offset` (irradiance stamped mid-hour);
it is passed through in `meta` untouched, as pvlib does.

## Reference

1. Spec — PVGIS non-interactive service (TMY tool), JRC European Commission:
   https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/getting-started-pvgis/api-non-interactive-service_en
   ; Huld, Müller & Gambardella 2012, "A new solar radiation database for estimating PV
   performance in Europe and Africa", Solar Energy 86(6).
2. Reference implementation — `pvlib.iotools.get_pvgis_tmy` @ pvlib 0.16.1 (default
   arguments), with `requests.get` stubbed to return the captured response.
3. Fixtures — `scripts/fixtures/io.py` → `pvgis-tmy-fixtures.json` from `pvgis-tmy-raw.json`
   (a real Seoul response trimmed to 38 rows around month seams). Request query and rows
   are compared exactly (parse + rename, no arithmetic).
