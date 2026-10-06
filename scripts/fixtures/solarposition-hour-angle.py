# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for pvkit solarposition/hour-angle from pvlib.solarposition.hour_angle.

Run: uv run scripts/fixtures/solarposition-hour-angle.py
Writes packages/pvkit/src/models/solarposition/hour-angle/hour-angle-fixtures.json.
Times are passed UTC-localized (pvkit's timeMs); pvlib's value is not wrapped, so the
test compares modulo 360°.
"""

import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import pvlib

OUT = Path(__file__).resolve().parents[2] / "packages/pvkit/src/models/solarposition/hour-angle/hour-angle-fixtures.json"


def ms(*args):
    return int(datetime(*args, tzinfo=timezone.utc).timestamp() * 1000)


def case(time_ms, lon, eot):
    t = pd.DatetimeIndex([pd.Timestamp(time_ms, unit="ms", tz="UTC")])
    ha = float(np.asarray(pvlib.solarposition.hour_angle(t, lon, eot))[0])
    return {"input": {"timeMs": time_ms, "longitude": lon, "equationOfTime": eot},
            "expected": {"hourAngle": ha}}


cases = [
    case(ms(2025, 6, 21, 12, 0, 0), 0.0, 0.0),
    case(ms(2024, 2, 29, 3, 0, 0), 126.978, -12.5),
    case(ms(2025, 1, 1, 0, 0, 0), -180.0, 3.2),
    case(ms(2025, 1, 1, 23, 59, 59), 180.0, -3.2),
    case(ms(1969, 7, 20, 20, 17, 40), -105.1786, 16.4),
    case(ms(2100, 12, 31, 11, 30, 0), 179.999, 14.0),
]
rng = np.random.default_rng(20261005)
lo, hi = ms(1950, 1, 1, 0, 0, 0), ms(2080, 1, 1, 0, 0, 0)
for _ in range(60):
    cases.append(case(int(rng.integers(lo, hi)), float(rng.uniform(-180, 180)), float(rng.uniform(-17, 17))))

meta = {"reference": f"pvlib.solarposition.hour_angle (UTC times) @ pvlib {pvlib.__version__}"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
