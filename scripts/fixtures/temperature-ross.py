# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# ///
"""Fixtures for @pvkit/core temperature/ross from pvlib.temperature.ross (noct form).

Run: uv run scripts/fixtures/temperature-ross.py
Writes packages/core/src/models/temperature/ross/ross-fixtures.json.
"""

import json
from pathlib import Path

import numpy as np
import pvlib
from pvlib.temperature import ross

OUT = Path(__file__).resolve().parents[2] / "packages/core/src/models/temperature/ross/ross-fixtures.json"


def case(poa, temp_air, noct):
    t = float(ross(poa, temp_air, noct=noct))
    return {"input": dict(poaGlobal=poa, tempAir=temp_air, noct=noct),
            "expected": {"cellTemperature": t}}


cases = [case(poa, ta, noct) for poa, ta, noct in [
    (800.0, 20.0, 45.0), (1000.0, 25.0, 45.0), (0.0, 15.0, 45.0), (-5.0, -10.0, 48.0),
    (1400.0, 50.0, 55.0), (800.0, -40.0, 20.0), (200.0, 0.0, 42.0)]]
rng = np.random.default_rng(20261005)
for _ in range(60):
    cases.append(case(float(rng.uniform(0, 1400)), float(rng.uniform(-30, 50)),
                      float(rng.uniform(40, 55))))

meta = {"reference": f"pvlib.temperature.ross(noct=...) @ pvlib {pvlib.__version__}"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
