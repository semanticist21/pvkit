# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for pvkit decomposition/disc from pvlib.irradiance.disc.

Run: uv run scripts/fixtures/decomposition-disc.py
Writes packages/pvkit/src/models/decomposition/disc/disc-fixtures.json. NaN outputs → null.
"""

import json
import math
from pathlib import Path

import numpy as np
import pandas as pd
import pvlib

OUT = Path(__file__).resolve().parents[2] / "packages/pvkit/src/models/decomposition/disc/disc-fixtures.json"


def num(x):
    x = float(x)
    return None if math.isnan(x) else x


def case(ghi, zenith, time_ms, pressure=101325.0, min_cos_zenith=0.065, max_zenith=87.0,
         max_airmass=12.0):
    when = pd.DatetimeIndex([pd.Timestamp(time_ms, unit="ms", tz="UTC")])
    r = pvlib.irradiance.disc(pd.Series([ghi], index=when), pd.Series([zenith], index=when), when,
                              pressure=pressure, min_cos_zenith=min_cos_zenith,
                              max_zenith=max_zenith, max_airmass=max_airmass).iloc[0]
    inp = dict(ghi=ghi, solarZenith=zenith, timeMs=time_ms, pressure=pressure,
               minCosZenith=min_cos_zenith, maxZenith=max_zenith, maxAirmass=max_airmass)
    return {"input": inp, "expected": {k: num(r[k]) for k in ("dni", "kt", "airmass")}}


T = 1_718_000_000_000  # 2024-06-10
cases = [
    case(0.0, 30.0, T),
    case(-3.0, 30.0, T),            # negative GHI → dni 0
    case(300.0, 30.0, T),           # kt ≤ 0.6 branch
    case(1000.0, 15.0, T),          # kt > 0.6 branch
    case(1500.0, 10.0, T),          # kt clipped to 1
    case(800.0, 30.0, T, pressure=None),   # relative airmass
    case(800.0, 30.0, T, pressure=70000.0),
    case(80.0, 84.0, T),            # airmass hits max_airmass
    case(80.0, 84.0, T, max_airmass=20.0),
    case(30.0, 86.9, T),
    case(30.0, 87.5, T),            # above max_zenith → 0
    case(5.0, 90.0, T),
    case(0.0, 95.0, T),             # below horizon: airmass NaN, dni 0
    case(300.0, 45.0, 1709208000000),  # leap day
    case(300.0, 45.0, 1735689599000),  # 2024-12-31T23:59:59Z (doy 366)
]
rng = np.random.default_rng(20261005)
lo, hi = 946_684_800_000, 2_524_608_000_000  # 2000..2050
for _ in range(60):
    cases.append(case(float(rng.uniform(-5, 1200)), float(rng.uniform(0, 89)),
                      int(rng.integers(lo, hi)), float(rng.uniform(60000, 105000))))
for _ in range(20):
    cases.append(case(float(rng.uniform(0, 300)), float(rng.uniform(80, 92)),
                      int(rng.integers(lo, hi)), float(rng.uniform(60000, 105000))))
for _ in range(10):
    cases.append(case(float(rng.uniform(0, 1100)), float(rng.uniform(0, 89)),
                      int(rng.integers(lo, hi)), None, float(rng.uniform(0, 0.2)),
                      float(rng.uniform(80, 89)), float(rng.uniform(5, 30))))

meta = {"reference": f"pvlib.irradiance.disc @ pvlib {pvlib.__version__}", "nan": "null"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
