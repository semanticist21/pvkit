# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for @pvkit/core temperature/faiman from pvlib.temperature.faiman.

Run: uv run scripts/fixtures/temperature-faiman.py
Writes packages/core/src/models/temperature/faiman/faiman-fixtures.json.
"""

import json
from pathlib import Path

import numpy as np
import pvlib
from pvlib.temperature import faiman

OUT = Path(__file__).resolve().parents[2] / "packages/core/src/models/temperature/faiman/faiman-fixtures.json"


def case(poa, temp_air, wind, u0=25.0, u1=6.84):
    inp = dict(poaGlobal=poa, tempAir=temp_air, windSpeed=wind, u0=u0, u1=u1)
    t = float(faiman(poa, temp_air, wind_speed=wind, u0=u0, u1=u1))
    return {"input": inp, "expected": {"moduleTemperature": t}}


cases = [case(poa, ta, ws) for poa, ta, ws in [
    (1000.0, 25.0, 1.0), (1000.0, 10.0, 0.0), (0.0, 15.0, 3.0), (-5.0, -10.0, 2.0),
    (1400.0, 50.0, 0.0), (800.0, -40.0, 30.0), (200.0, 0.0, 15.0)]]
rng = np.random.default_rng(20261005)
for _ in range(100):
    cases.append(case(
        float(rng.uniform(0, 1400)), float(rng.uniform(-30, 50)), float(rng.uniform(0, 20)),
        float(rng.uniform(10, 40)), float(rng.uniform(0, 12)),
    ))

meta = {"reference": f"pvlib.temperature.faiman @ pvlib {pvlib.__version__}"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
