# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for pvkit iam/physical from pvlib.iam.physical.

Run: uv run scripts/fixtures/iam-physical.py
Writes packages/pvkit/src/models/iam/physical/physical-fixtures.json.
"""

import json
from pathlib import Path

import numpy as np
import pvlib

OUT = Path(__file__).resolve().parents[2] / "packages/pvkit/src/models/iam/physical/physical-fixtures.json"


def case(aoi, n=1.526, k=4.0, l=0.002, n_ar=None):
    iam = float(pvlib.iam.physical(np.array([aoi]), n=n, K=k, L=l, n_ar=n_ar)[0])
    inp = dict(aoi=aoi, n=n, k=k, l=l)
    if n_ar is not None:
        inp["nAr"] = n_ar
    return {"input": inp, "expected": iam}


cases = [case(a) for a in [0.0, 1e-6, 10.0, 30.0, 45.0, 60.0, 75.0, 85.0, 89.0, 89.9, 89.999,
                            90.0, 90.001, 95.0, 135.0, 180.0, -30.0, -89.9, -90.0, -120.0]]
# AR coating (typical 1.29), n_ar ≈ 1 (treated as uncoated), n_ar ≈ n (no second interface).
cases += [case(a, n_ar=1.29) for a in [0.0, 30.0, 60.0, 85.0, 89.9, 90.0, 100.0]]
cases += [case(a, n_ar=1.0) for a in [20.0, 70.0]]
cases += [case(a, n_ar=1.526) for a in [20.0, 70.0]]
# n = 1 (no refraction): pvlib forces aoi ≥ 90 → 0.
cases += [case(a, n=1.0) for a in [0.0, 45.0, 89.0, 90.0, 120.0]]
# Thick/absorbing glass, zero absorption.
cases += [case(a, k=0.0) for a in [0.0, 50.0, 88.0]]
cases += [case(a, k=40.0, l=0.01) for a in [0.0, 50.0, 88.0]]

rng = np.random.default_rng(20261005)
for _ in range(60):
    ar = float(rng.uniform(1.1, 1.45)) if rng.random() < 0.4 else None
    cases.append(case(float(rng.uniform(-95, 95)), float(rng.uniform(1.2, 2.0)),
                      float(rng.uniform(0, 20)), float(rng.uniform(0.0005, 0.005)), ar))

meta = {"reference": f"pvlib.iam.physical @ pvlib {pvlib.__version__}"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
