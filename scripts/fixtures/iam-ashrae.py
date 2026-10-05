# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for @pvkit/core iam/ashrae from pvlib.iam.ashrae.

Run: uv run scripts/fixtures/iam-ashrae.py
Writes packages/core/src/models/iam/ashrae/ashrae-fixtures.json.
"""

import json
from pathlib import Path

import numpy as np
import pvlib

OUT = Path(__file__).resolve().parents[2] / "packages/core/src/models/iam/ashrae/ashrae-fixtures.json"


def case(aoi, b=0.05):
    iam = float(pvlib.iam.ashrae(np.array([aoi]), b=b)[0])
    return {"input": dict(aoi=aoi, b=b), "expected": iam}


cases = [case(a) for a in [0.0, 10.0, 30.0, 45.0, 60.0, 75.0, 80.0, 85.0, 87.0, 87.2, 88.0,
                            89.9, 90.0, 90.001, 120.0, 180.0, -45.0, -87.0, -90.0, -135.0]]
cases += [case(a, b=0.0) for a in [0.0, 60.0, 89.9]]
cases += [case(a, b=0.2) for a in [30.0, 60.0, 75.0, 80.0]]
rng = np.random.default_rng(20261005)
cases += [case(float(rng.uniform(-95, 95)), float(rng.uniform(0.01, 0.1))) for _ in range(60)]

meta = {"reference": f"pvlib.iam.ashrae @ pvlib {pvlib.__version__}"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
