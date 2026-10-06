# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for pvkit solarposition/sunrise-spa from pvlib.solarposition.sun_rise_set_transit_spa.

Run: uv run scripts/fixtures/solarposition-sunrise-spa.py
Writes packages/pvkit/src/models/solarposition/sunrise-spa/sunrise-spa-fixtures.json.
Times are UTC midnights (UTC-localized index); results are UTC epoch ms, null for NaT
(polar day/night).
"""

import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import pvlib

OUT = Path(__file__).resolve().parents[2] / "packages/pvkit/src/models/solarposition/sunrise-spa/sunrise-spa-fixtures.json"


def ms(*args):
    return int(datetime(*args, tzinfo=timezone.utc).timestamp() * 1000)


def to_ms(ts):
    return None if pd.isna(ts) else ts.value / 1e6


def case(time_ms, lat, lon, delta_t=67.0):
    t = pd.DatetimeIndex([pd.Timestamp(time_ms, unit="ms", tz="UTC")])
    r = pvlib.solarposition.sun_rise_set_transit_spa(t, lat, lon, how="numpy", delta_t=delta_t).iloc[0]
    return {"input": {"timeMs": time_ms, "latitude": lat, "longitude": lon, "deltaT": delta_t},
            "expected": {k: to_ms(r[k]) for k in ("sunrise", "sunset", "transit")}}


cases = [
    # Reda & Andreas (2008) Table A5.1 example day (local date 2003-10-17).
    case(ms(2003, 10, 17), 39.742476, -105.1786),
    # Leap day, solstices, dateline, equator.
    case(ms(2024, 2, 29), 37.5665, 126.978),
    case(ms(2025, 6, 21), 51.4779, -0.0015),
    case(ms(2025, 12, 21), -33.8688, 151.2093),
    case(ms(2025, 3, 20), 0.0, 180.0),
    case(ms(2025, 9, 22), 0.0, -180.0),
    # Polar day / night (NaN sunrise/sunset) and near-threshold latitudes.
    case(ms(2025, 6, 21), 78.2232, 15.6267),
    case(ms(2025, 12, 21), 78.2232, 15.6267),
    case(ms(2025, 6, 21), -89.9, 0.0),
    case(ms(2025, 6, 21), 66.0, 25.0),
    case(ms(2025, 12, 21), 65.5, -150.0),
    case(ms(1900, 1, 1), 60.0, 10.0, -2.7),
    case(ms(2100, 12, 31), -60.0, -70.0, 200.0),
    # Non-midnight inputs (incl. pre-1970 negative ms): floored to 00:00 UTC of that day.
    case(ms(2024, 2, 29, 23, 59, 59), 37.5665, 126.978),
    case(ms(1965, 5, 10, 13, 0, 0), -23.5, 46.0),
]
rng = np.random.default_rng(20261005)
lo, hi = ms(1950, 1, 1) // 86_400_000, ms(2080, 1, 1) // 86_400_000
for _ in range(80):
    cases.append(case(int(rng.integers(lo, hi)) * 86_400_000, float(rng.uniform(-70, 70)),
                      float(rng.uniform(-180, 180)), float(rng.uniform(55, 75))))
# High latitudes: mix of normal, polar day and polar night.
for _ in range(30):
    cases.append(case(int(rng.integers(lo, hi)) * 86_400_000, float(rng.choice([-1, 1]) * rng.uniform(60, 89.5)),
                      float(rng.uniform(-180, 180))))

meta = {"reference": f"pvlib.solarposition.sun_rise_set_transit_spa (how='numpy') @ pvlib {pvlib.__version__}",
        "unit": "UTC epoch ms; null = no event"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
