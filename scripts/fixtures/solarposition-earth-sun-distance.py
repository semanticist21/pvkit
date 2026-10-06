# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for pvkit solarposition/earth-sun-distance from pvlib.solarposition.nrel_earthsun_distance.

Run: uv run scripts/fixtures/solarposition-earth-sun-distance.py
Writes packages/pvkit/src/models/solarposition/earth-sun-distance/earth-sun-distance-fixtures.json.
"""

import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import pvlib

OUT = (Path(__file__).resolve().parents[2]
       / "packages/pvkit/src/models/solarposition/earth-sun-distance/earth-sun-distance-fixtures.json")


def ms(*args):
    return int(datetime(*args, tzinfo=timezone.utc).timestamp() * 1000)


def case(time_ms, delta_t=67.0):
    t = pd.DatetimeIndex([pd.Timestamp(time_ms, unit="ms", tz="UTC")])
    r = float(pvlib.solarposition.nrel_earthsun_distance(t, how="numpy", delta_t=delta_t).iloc[0])
    return {"input": {"timeMs": time_ms, "deltaT": delta_t}, "expected": {"distance": r}}


cases = [
    # Reda & Andreas (2008) Table A5.1 example instant.
    case(ms(2003, 10, 17, 19, 30, 30)),
    # Perihelion / aphelion neighbourhoods, leap day, century extremes.
    case(ms(2025, 1, 4, 13, 28, 0)),
    case(ms(2025, 7, 3, 19, 55, 0)),
    case(ms(2024, 2, 29, 12, 0, 0)),
    case(ms(1900, 1, 1, 0, 0, 0), -2.7),
    case(ms(2100, 12, 31, 23, 59, 59), 200.0),
]
rng = np.random.default_rng(20261005)
lo, hi = ms(1950, 1, 1, 0, 0, 0), ms(2080, 1, 1, 0, 0, 0)
for _ in range(54):
    cases.append(case(int(rng.integers(lo, hi)), float(rng.uniform(55, 75))))

meta = {"reference": f"pvlib.solarposition.nrel_earthsun_distance (how='numpy') @ pvlib {pvlib.__version__}",
        "unit": "AU"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
