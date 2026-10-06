# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for pvkit atmosphere/absolute-airmass from pvlib.atmosphere.get_absolute_airmass.

Run: uv run scripts/fixtures/atmosphere-absolute-airmass.py
Writes packages/pvkit/src/models/atmosphere/absolute-airmass/absolute-airmass-fixtures.json.
"""

import json
from pathlib import Path

import numpy as np
import pvlib

OUT = (Path(__file__).resolve().parents[2]
       / "packages/pvkit/src/models/atmosphere/absolute-airmass/absolute-airmass-fixtures.json")


def case(am, pressure):
    return {"input": {"airmassRelative": am, "pressure": pressure},
            "expected": float(pvlib.atmosphere.get_absolute_airmass(am, pressure=pressure))}


rng = np.random.default_rng(20261005)
cases = [case(1.0, 101325.0), case(37.92, 101325.0), case(1.0, 0.0), case(5.0, 60000.0),
         case(38.0, 110000.0), case(1.5, 33000.0)]
cases += [case(float(rng.uniform(1, 38)), float(rng.uniform(50000, 108000))) for _ in range(44)]

meta = {"reference": f"pvlib.atmosphere.get_absolute_airmass @ pvlib {pvlib.__version__}"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
