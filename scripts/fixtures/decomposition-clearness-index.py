# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# ///
"""Fixtures for @pvkit/core decomposition/clearness-index from pvlib.irradiance.clearness_index.

Run: uv run scripts/fixtures/decomposition-clearness-index.py
Writes packages/core/src/models/decomposition/clearness-index/clearness-index-fixtures.json.
"""

import json
from pathlib import Path

import numpy as np
import pvlib

OUT = (Path(__file__).resolve().parents[2]
       / "packages/core/src/models/decomposition/clearness-index/clearness-index-fixtures.json")


def case(ghi, zenith, dni_extra, min_cos_zenith=0.065, max_kt=2.0):
    kt = pvlib.irradiance.clearness_index(ghi, zenith, dni_extra, min_cos_zenith=min_cos_zenith,
                                          max_clearness_index=max_kt)
    inp = dict(ghi=ghi, solarZenith=zenith, dniExtra=dni_extra, minCosZenith=min_cos_zenith,
               maxClearnessIndex=max_kt)
    return {"input": inp, "expected": {"kt": float(kt)}}


cases = [
    case(0.0, 30.0, 1366.1),
    case(-5.0, 30.0, 1366.1),           # negative GHI → 0
    case(1000.0, 0.0, 1366.1),
    case(1366.1, 0.0, 1366.1),
    case(100.0, 89.0, 1366.1),          # cos below min_cos_zenith → floored
    case(100.0, 90.0, 1366.1),
    case(100.0, 95.0, 1366.1),          # below horizon, still floored
    case(500.0, 86.0, 1366.1),          # capped at max_clearness_index
    case(500.0, 86.0, 1366.1, max_kt=1.0),
    case(400.0, 60.0, 1400.0, min_cos_zenith=0.2, max_kt=1.5),
]
rng = np.random.default_rng(20261005)
for _ in range(60):
    cases.append(case(float(rng.uniform(-10, 1300)), float(rng.uniform(0, 100)),
                      float(rng.uniform(1310, 1420)), float(rng.uniform(0.0, 0.2)),
                      float(rng.choice([1.0, 2.0]))))

meta = {"reference": f"pvlib.irradiance.clearness_index @ pvlib {pvlib.__version__}"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
