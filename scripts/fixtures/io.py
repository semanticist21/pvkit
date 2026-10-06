# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""@pvkit/io fixtures: pvlib's own fetchers parse captured API responses.

`<method>-raw.json` holds a real response (trimmed PVGIS TMY; NASA POWER with one value set
to the fill value). requests.get is stubbed to return it, so pvlib's public get_* path —
query building, parsing, renaming, unit conversion, year coercion — produces the expected
request and rows. Run: uv run scripts/fixtures/io.py
"""

import json
import math
from pathlib import Path
from unittest import mock

import pvlib

SRC = Path(__file__).resolve().parents[2] / "packages/io/src"


class Response:
    ok = True

    def __init__(self, body):
        self.body = body
        self.text = json.dumps(body)

    def json(self):
        return self.body


def call(raw, fn, *args, **kwargs):
    captured = {}

    def get(url, params=None, timeout=None):
        captured["url"] = url
        captured["params"] = {k: str(v) for k, v in params.items() if v is not None}
        return Response(raw)

    with mock.patch("requests.get", get):
        data, meta = fn(*args, **kwargs)
    return captured, data, meta


def rows(data, columns):
    out = []
    for ts, r in data.iterrows():
        row = {"timeMs": int(ts.timestamp() * 1000)}
        for src, dst in columns.items():
            v = float(r[src])
            row[dst] = None if math.isnan(v) else v
        out.append(row)
    return out


def write(name, payload):
    (SRC / name / f"{name}-fixtures.json").write_text(json.dumps(payload, indent=2) + "\n")


# --- PVGIS TMY -------------------------------------------------------------------------------
raw = json.loads((SRC / "pvgis-tmy/pvgis-tmy-raw.json").read_text())
cases = []
for kwargs in [{}, {"usehorizon": False, "startyear": 2010, "endyear": 2020}]:
    request, data, meta = call(raw, pvlib.iotools.get_pvgis_tmy, 37.5665, 126.978, **kwargs)
    cases.append({
        "input": kwargs,
        "request": request,
        "monthsSelected": meta["months_selected"],
        "irradianceTimeOffset": meta["inputs"]["location"]["irradiance_time_offset"],
        "rows": rows(data, {
            "ghi": "ghi", "dni": "dni", "dhi": "dhi", "IR(h)": "longwaveDown",
            "temp_air": "tempAir", "relative_humidity": "relativeHumidity",
            "wind_speed": "windSpeed", "wind_direction": "windDirection", "pressure": "pressure",
        }),
    })
write("pvgis-tmy", {"latitude": 37.5665, "longitude": 126.978, "coerceYear": 1990, "cases": cases})

# --- NASA POWER hourly -----------------------------------------------------------------------
# The raw capture holds every VARIABLE_MAP column. Case 1 requests all of them (checks the
# name map and both unit conversions); case 2 uses the default parameters plus the optional
# site-elevation / wind query fields.
NASA = pvlib.iotools.nasa_power


def camel(name):
    head, *rest = name.split("_")
    return head + "".join(w[:1].upper() + w[1:] for w in rest)


raw = json.loads((SRC / "nasa-power/nasa-power-raw.json").read_text())
cases = []
for parameters, kwargs in [
    (list(NASA.VARIABLE_MAP.values()), {}),
    (NASA.DEFAULT_PARAMETERS, {"elevation": 12, "wind_height": 50, "wind_surface": "seaice"}),
]:
    request, data, meta = call(
        raw, NASA.get_nasa_power, 37.5665, 126.978, "2024-02-28", "2024-03-01", parameters,
        **kwargs,
    )
    names = {"elevation": "altitude", "wind_height": "windHeight", "wind_surface": "windSurface"}
    cases.append({
        "input": {"parameters": [camel(p) for p in parameters]}
        | {names[k]: v for k, v in kwargs.items()},
        "request": request,
        "rows": rows(data, {p: camel(p) for p in parameters}),
    })
write("nasa-power", {
    "latitude": 37.5665,
    "longitude": 126.978,
    "start": "2024-02-28",
    "end": "2024-03-01",
    "variableMap": {camel(v): k for k, v in NASA.VARIABLE_MAP.items()},
    "defaultParameters": [camel(p) for p in NASA.DEFAULT_PARAMETERS],
    "meta": {k: meta[k] for k in ["latitude", "longitude", "altitude"]},
    "cases": cases,
})
