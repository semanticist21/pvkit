# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# ///
"""Fixtures for @pvkit/core solarposition/spa from pvlib.solarposition.spa_python.

Run: uv run scripts/fixtures/solarposition-spa.py
Writes packages/core/src/models/solarposition/spa/spa-fixtures.json.
"""

import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import pvlib

OUT = Path(__file__).resolve().parents[2] / "packages/core/src/models/solarposition/spa/spa-fixtures.json"
FIELDS = {
    "zenith": "zenith",
    "apparent_zenith": "apparentZenith",
    "elevation": "elevation",
    "apparent_elevation": "apparentElevation",
    "azimuth": "azimuth",
    "equation_of_time": "equationOfTime",
}


def ms(*args):
    return int(datetime(*args, tzinfo=timezone.utc).timestamp() * 1000)


def case(time_ms, lat, lon, elevation=0.0, pressure=101325.0, temperature=12.0, delta_t=67.0):
    t = pd.DatetimeIndex([pd.Timestamp(time_ms, unit="ms", tz="UTC")])
    r = pvlib.solarposition.spa_python(
        t, lat, lon, altitude=elevation, pressure=pressure, temperature=temperature,
        delta_t=delta_t, atmos_refract=0.5667, how="numpy",
    ).iloc[0]
    inp = dict(timeMs=time_ms, latitude=lat, longitude=lon, elevation=elevation,
               pressure=pressure, temperature=temperature, deltaT=delta_t)
    return {"input": inp, "expected": {v: float(r[k]) for k, v in FIELDS.items()}}


cases = [
    # Reda & Andreas (2008) Table A5.1 example: 2003-10-17 12:30:30 MST (UTC−7).
    case(ms(2003, 10, 17, 19, 30, 30), 39.742476, -105.1786, 1830.14, 82000.0, 11.0, 67.0),
    # Leap day, year boundaries, far past/future within PV interest.
    case(ms(2024, 2, 29, 12, 0, 0), 37.5665, 126.978),
    case(ms(2000, 1, 1, 12, 0, 0), 0.0, 0.0),
    case(ms(1900, 6, 21, 6, 0, 0), 51.4779, -0.0015),
    case(ms(2100, 12, 21, 18, 0, 0), -33.8688, 151.2093),
    # Poles and dateline.
    case(ms(2025, 6, 21, 0, 0, 0), 89.9, 0.0),
    case(ms(2025, 12, 21, 12, 0, 0), -89.9, 180.0),
    case(ms(2025, 3, 20, 9, 0, 0), 10.0, -180.0),
]

rng = np.random.default_rng(20261005)
lo, hi = ms(1950, 1, 1, 0, 0, 0), ms(2080, 1, 1, 0, 0, 0)
# Broad random sweep.
for _ in range(120):
    cases.append(case(
        int(rng.integers(lo, hi)), float(rng.uniform(-90, 90)), float(rng.uniform(-180, 180)),
        float(rng.uniform(0, 4000)), float(rng.uniform(60000, 105000)), float(rng.uniform(-30, 45)),
        float(rng.uniform(55, 75)),
    ))
# Near-horizon: keep random draws whose zenith lands in 84–96° (refraction cutoff region).
near = 0
while near < 40:
    c = case(int(rng.integers(lo, hi)), float(rng.uniform(-70, 70)), float(rng.uniform(-180, 180)))
    if 84 <= c["expected"]["zenith"] <= 96:
        cases.append(c)
        near += 1

meta = {"reference": f"pvlib.solarposition.spa_python (how='numpy') @ pvlib {pvlib.__version__}",
        "atmosRefract": 0.5667}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=1) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
