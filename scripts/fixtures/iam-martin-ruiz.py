# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for pvkit iam/martin-ruiz from pvlib.iam.martin_ruiz.

Run: uv run scripts/fixtures/iam-martin-ruiz.py
Writes packages/pvkit/src/models/iam/martin-ruiz/martin-ruiz-fixtures.json.
"""

import json
from pathlib import Path

import numpy as np
import pvlib

OUT = Path(__file__).resolve().parents[2] / "packages/pvkit/src/models/iam/martin-ruiz/martin-ruiz-fixtures.json"


def case(aoi, a_r=0.16):
    iam = float(pvlib.iam.martin_ruiz(np.array([aoi]), a_r=a_r)[0])
    return {"input": dict(aoi=aoi, aR=a_r), "expected": iam}


cases = [case(a) for a in [0.0, 10.0, 30.0, 45.0, 60.0, 75.0, 85.0, 89.0, 89.9, 89.999,
                            90.0, 90.001, 120.0, 180.0, -45.0, -89.9, -90.0, -135.0]]
cases += [case(a, a_r=0.01) for a in [0.0, 60.0, 89.9]]
cases += [case(a, a_r=5.0) for a in [0.0, 60.0, 89.9]]
rng = np.random.default_rng(20261005)
cases += [case(float(rng.uniform(-95, 95)), float(rng.uniform(0.08, 0.25))) for _ in range(60)]

meta = {"reference": f"pvlib.iam.martin_ruiz @ pvlib {pvlib.__version__}"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
