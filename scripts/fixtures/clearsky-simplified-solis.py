# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for @pvkit/core clearsky/simplified-solis from pvlib.clearsky.simplified_solis.

Run: uv run scripts/fixtures/clearsky-simplified-solis.py
Writes packages/core/src/models/clearsky/simplified-solis/simplified-solis-fixtures.json.
"""

import json
from pathlib import Path

import numpy as np
import pvlib

OUT = (Path(__file__).resolve().parents[2]
       / "packages/core/src/models/clearsky/simplified-solis/simplified-solis-fixtures.json")


def case(h, aod700=0.1, pw=1.0, pressure=101325.0, dni_extra=1364.0):
    r = pvlib.clearsky.simplified_solis(h, aod700=aod700, precipitable_water=pw,
                                        pressure=pressure, dni_extra=dni_extra)
    inp = dict(apparentElevation=h, aod700=aod700, precipitableWater=pw, pressure=pressure,
               dniExtra=dni_extra)
    return {"input": inp, "expected": {k: float(r[k]) for k in ("ghi", "dni", "dhi")}}


cases = [
    case(90.0),
    case(60.0),
    case(30.0, 0.3, 3.0, 85000.0, 1400.0),
    # Diffuse coefficient switch at aod700 = 0.05, and aod700 = 0.
    case(45.0, 0.0),
    case(45.0, 0.049999),
    case(45.0, 0.05),
    case(45.0, 0.45, 10.0, 41000.0),
    # Precipitable-water clamp at 0.2 cm.
    case(45.0, 0.1, 0.0),
    case(45.0, 0.1, 0.1),
    case(45.0, 0.1, 0.2),
    # Near / below horizon.
    case(5.0),
    case(1.0),
    case(0.1),
    case(0.0),
    case(-0.5),
    case(-30.0),
]

rng = np.random.default_rng(20261005)
for _ in range(100):
    cases.append(case(float(rng.uniform(-5, 90)), float(rng.uniform(0, 0.45)),
                      float(rng.uniform(0.2, 10)), float(rng.uniform(41000, 105000)),
                      float(rng.uniform(1300, 1420))))
for _ in range(30):
    cases.append(case(float(rng.uniform(0, 5)), float(rng.uniform(0, 0.45)),
                      float(rng.uniform(0.2, 10)), float(rng.uniform(60000, 101325))))

meta = {"reference": f"pvlib.clearsky.simplified_solis @ pvlib {pvlib.__version__}"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=1) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
