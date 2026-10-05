# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for @pvkit/core iam/interp from pvlib.iam.interp (method='linear').

Run: uv run scripts/fixtures/iam-interp.py
Writes packages/core/src/models/iam/interp/interp-fixtures.json.
"""

import json
from pathlib import Path

import numpy as np
import pvlib

OUT = Path(__file__).resolve().parents[2] / "packages/core/src/models/iam/interp/interp-fixtures.json"


def case(aoi, theta_ref, iam_ref, normalize=True):
    iam = float(pvlib.iam.interp(np.array([aoi]), theta_ref, iam_ref, method="linear",
                                 normalize=normalize)[0])
    inp = dict(aoi=aoi, thetaRef=list(theta_ref), iamRef=list(iam_ref), normalize=normalize)
    return {"input": inp, "expected": iam}


# pvlib docs-style measured table on 0..90.
T1 = [0.0, 10.0, 20.0, 30.0, 40.0, 50.0, 55.0, 60.0, 65.0, 70.0, 75.0, 80.0, 85.0, 90.0]
I1 = [1.0, 0.999, 0.998, 0.996, 0.993, 0.983, 0.973, 0.958, 0.932, 0.89, 0.823, 0.7, 0.48, 0.0]
# Table not starting at 0 (extrapolated normalisation) and not reaching 90 (negative clamp).
T2 = [5.0, 30.0, 60.0, 80.0]
I2 = [1.01, 0.99, 0.9, 0.5]
# Two points only.
T3 = [0.0, 90.0]
I3 = [1.0, 0.0]
cases = []
for a in [0.0, 5.0, 10.0, 12.5, 55.0, 77.7, 85.0, 89.0, 90.0, 95.0, -40.0, -90.0]:
    cases += [case(a, T1, I1), case(a, T1, I1, normalize=False)]
for a in [0.0, 2.0, 5.0, 45.0, 80.0, 90.0, 100.0, 120.0, -100.0]:
    cases += [case(a, T2, I2), case(a, T2, I2, normalize=False)]
cases += [case(a, T3, I3) for a in [0.0, 45.0, 90.0, 135.0]]

rng = np.random.default_rng(20261005)
for _ in range(50):
    k = int(rng.integers(2, 12))
    theta = np.sort(rng.choice(np.arange(0, 91, 1.0), k, replace=False))
    iam = np.sort(rng.uniform(0, 1.05, k))[::-1]
    cases.append(case(float(rng.uniform(-100, 100)), [float(x) for x in theta],
                      [float(x) for x in iam], bool(rng.random() < 0.7)))

meta = {"reference": f"pvlib.iam.interp(method='linear') @ pvlib {pvlib.__version__}"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
