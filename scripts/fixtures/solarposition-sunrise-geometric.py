# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for pvkit solarposition/sunrise-geometric from pvlib.solarposition.sun_rise_set_transit_geometric.

Run: uv run scripts/fixtures/solarposition-sunrise-geometric.py
Writes packages/pvkit/src/models/solarposition/sunrise-geometric/sunrise-geometric-fixtures.json.
Times are UTC-localized; declination is given in degrees (pvlib takes radians); results are
UTC epoch ms, null for NaT (polar day/night).
"""

import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import pvlib

OUT = (Path(__file__).resolve().parents[2]
       / "packages/pvkit/src/models/solarposition/sunrise-geometric/sunrise-geometric-fixtures.json")


def ms(*args):
    return int(datetime(*args, tzinfo=timezone.utc).timestamp() * 1000)


def to_ms(ts):
    return None if pd.isna(ts) else ts.value / 1e6


def case(time_ms, lat, lon, decl, eot):
    t = pd.DatetimeIndex([pd.Timestamp(time_ms, unit="ms", tz="UTC")])
    rise, sset, transit = pvlib.solarposition.sun_rise_set_transit_geometric(
        t, lat, lon, np.radians(decl), eot)
    return {"input": {"timeMs": time_ms, "latitude": lat, "longitude": lon,
                      "declination": decl, "equationOfTime": eot},
            "expected": {"sunrise": to_ms(rise[0]), "sunset": to_ms(sset[0]), "transit": to_ms(transit[0])}}


def doy_case(time_ms, lat, lon):
    doy = pd.Timestamp(time_ms, unit="ms", tz="UTC").dayofyear
    decl = float(np.degrees(pvlib.solarposition.declination_spencer71(doy)))
    return case(time_ms, lat, lon, decl, float(pvlib.solarposition.equation_of_time_spencer71(doy)))


cases = [
    doy_case(ms(2003, 10, 17), 39.742476, -105.1786),
    doy_case(ms(2024, 2, 29, 15, 0, 0), 37.5665, 126.978),
    doy_case(ms(2025, 6, 21), 0.0, 180.0),
    doy_case(ms(2025, 12, 21), -33.8688, 151.2093),
    # Equinox (δ = 0), polar day / night, pole.
    case(ms(2025, 3, 20), 60.0, 10.0, 0.0, -7.5),
    case(ms(2025, 6, 21), 78.2232, 15.6267, 23.44, -1.8),
    case(ms(2025, 12, 21), 78.2232, 15.6267, -23.44, 1.9),
    case(ms(2025, 6, 21), -70.0, -60.0, 23.44, -1.8),
    case(ms(2025, 6, 21), 66.56, 0.0, 23.43, -1.8),
]
rng = np.random.default_rng(20261005)
lo, hi = ms(1950, 1, 1), ms(2080, 1, 1)
for _ in range(70):
    cases.append(case(int(rng.integers(lo, hi)), float(rng.uniform(-89, 89)), float(rng.uniform(-180, 180)),
                      float(rng.uniform(-23.45, 23.45)), float(rng.uniform(-17, 17))))

meta = {"reference": f"pvlib.solarposition.sun_rise_set_transit_geometric @ pvlib {pvlib.__version__}",
        "unit": "UTC epoch ms; null = no event"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
