# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# ///
"""Fixtures for @pvkit/core decomposition/erbs from pvlib.irradiance.erbs.

Run: uv run scripts/fixtures/decomposition-erbs.py
Writes packages/core/src/models/decomposition/erbs/erbs-fixtures.json.
Cases with `timeMs` pass a UTC DatetimeIndex; cases with `dniExtra` pass a day-of-year and
record pvlib's get_extra_radiation(doy) (the value erbs uses internally) as the input.
"""

import json
from pathlib import Path

import numpy as np
import pandas as pd
import pvlib

OUT = Path(__file__).resolve().parents[2] / "packages/core/src/models/decomposition/erbs/erbs-fixtures.json"


def case(ghi, zenith, time_ms=None, doy=None, min_cos_zenith=0.065, max_zenith=87.0):
    if time_ms is not None:
        when = pd.DatetimeIndex([pd.Timestamp(time_ms, unit="ms", tz="UTC")])
        inp = {"ghi": ghi, "solarZenith": zenith, "timeMs": time_ms}
    else:
        when = np.array([doy])
        inp = {"ghi": ghi, "solarZenith": zenith,
               "dniExtra": float(pvlib.irradiance.get_extra_radiation(doy))}
    inp |= {"minCosZenith": min_cos_zenith, "maxZenith": max_zenith}
    r = pvlib.irradiance.erbs(np.array([ghi]), np.array([zenith]), when,
                              min_cos_zenith=min_cos_zenith, max_zenith=max_zenith)
    return {"input": inp, "expected": {k: float(np.asarray(r[k])[0]) for k in ("dni", "dhi", "kt")}}


T = 1_718_000_000_000  # 2024-06-10
cases = [
    case(0.0, 30.0, T),
    case(-3.0, 30.0, T),          # negative GHI → dni 0, dhi = ghi
    case(150.0, 30.0, T),         # kt ≤ 0.22 branch
    case(500.0, 30.0, T),         # middle polynomial
    case(1100.0, 10.0, T),        # kt > 0.8 branch
    case(1500.0, 10.0, T),        # kt clipped to 1
    case(50.0, 86.9, T),
    case(50.0, 87.1, T),          # above max_zenith
    case(5.0, 89.5, T),
    case(0.0, 120.0, T),
    case(400.0, 50.0, doy=1),
    case(400.0, 50.0, doy=366),
    case(300.0, 45.0, 1709208000000),  # leap day 2024-02-29
    case(300.0, 80.0, T, min_cos_zenith=0.2, max_zenith=85.0),
]
rng = np.random.default_rng(20261005)
lo, hi = 946_684_800_000, 2_524_608_000_000  # 2000..2050
for _ in range(50):
    cases.append(case(float(rng.uniform(-5, 1200)), float(rng.uniform(0, 95)),
                      int(rng.integers(lo, hi))))
for _ in range(15):
    cases.append(case(float(rng.uniform(0, 300)), float(rng.uniform(80, 92)),
                      int(rng.integers(lo, hi))))
for _ in range(15):
    cases.append(case(float(rng.uniform(0, 1200)), float(rng.uniform(0, 89)),
                      doy=int(rng.integers(1, 366))))

meta = {"reference": f"pvlib.irradiance.erbs @ pvlib {pvlib.__version__}"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
