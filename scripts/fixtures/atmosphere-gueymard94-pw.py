# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# ///
"""Fixtures for @pvkit/core atmosphere/gueymard94-pw from pvlib.atmosphere.gueymard94_pw.

Run: uv run scripts/fixtures/atmosphere-gueymard94-pw.py
Writes packages/core/src/models/atmosphere/gueymard94-pw/gueymard94-pw-fixtures.json.
"""

import json
from pathlib import Path

import numpy as np
import pvlib

OUT = (Path(__file__).resolve().parents[2]
       / "packages/core/src/models/atmosphere/gueymard94-pw/gueymard94-pw-fixtures.json")


def case(t, rh):
    return {"input": {"tempAir": t, "relativeHumidity": rh},
            "expected": float(pvlib.atmosphere.gueymard94_pw(t, rh))}


rng = np.random.default_rng(20261005)
# Includes the 0.1 cm floor (dry/cold) and extremes of temperature and RH.
cases = [case(t, rh) for t, rh in [(20.0, 50.0), (0.0, 0.0), (-40.0, 100.0), (-40.0, 5.0),
                                   (50.0, 100.0), (50.0, 1.0), (25.0, 100.0), (35.0, 80.0),
                                   (-10.0, 30.0), (10.0, 0.5)]]
cases += [case(float(rng.uniform(-40, 50)), float(rng.uniform(0, 100))) for _ in range(50)]

meta = {"reference": f"pvlib.atmosphere.gueymard94_pw @ pvlib {pvlib.__version__}"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
