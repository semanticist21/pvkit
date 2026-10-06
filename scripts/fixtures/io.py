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
        "rows": rows(data, {
            "ghi": "ghi", "dni": "dni", "dhi": "dhi", "IR(h)": "longwaveDown",
            "temp_air": "tempAir", "relative_humidity": "relativeHumidity",
            "wind_speed": "windSpeed", "wind_direction": "windDirection", "pressure": "pressure",
        }),
    })
write("pvgis-tmy", {"latitude": 37.5665, "longitude": 126.978, "coerceYear": 1990, "cases": cases})

# --- NASA POWER hourly -----------------------------------------------------------------------
raw = json.loads((SRC / "nasa-power/nasa-power-raw.json").read_text())
params = ["ghi", "dni", "dhi", "temp_air", "wind_speed", "relative_humidity", "pressure"]
request, data, meta = call(
    raw, pvlib.iotools.get_nasa_power, 37.5665, 126.978, "2024-02-28", "2024-03-01", params
)
write("nasa-power", {
    "latitude": 37.5665,
    "longitude": 126.978,
    "start": "2024-02-28",
    "end": "2024-03-01",
    "request": request,
    "meta": {k: meta[k] for k in ["latitude", "longitude", "altitude"]},
    "rows": rows(data, {
        "ghi": "ghi", "dni": "dni", "dhi": "dhi", "temp_air": "tempAir", "wind_speed": "windSpeed",
        "relative_humidity": "relativeHumidity", "pressure": "pressure",
    }),
})
