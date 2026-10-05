# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# ///
"""Fixtures for @pvkit/core iam/sapm from pvlib.iam.sapm, coefficients B0..B5 drawn from
pvlib's bundled Sandia module database.

Run: uv run scripts/fixtures/iam-sapm.py
Writes packages/core/src/models/iam/sapm/sapm-fixtures.json.
"""

import json
from pathlib import Path

import numpy as np
import pvlib

OUT = Path(__file__).resolve().parents[2] / "packages/core/src/models/iam/sapm/sapm-fixtures.json"
mods = pvlib.pvsystem.retrieve_sam("SandiaMod")
NAMES = sorted(mods.columns)


def case(aoi, name, upper=None):
    m = mods[name]
    coeffs = {f"B{i}": float(m[f"B{i}"]) for i in range(6)}
    iam = float(pvlib.iam.sapm(np.array([aoi]), coeffs, upper=upper)[0])
    inp = dict(aoi=aoi, **{f"b{i}": coeffs[f"B{i}"] for i in range(6)})
    if upper is not None:
        inp["upper"] = upper
    return {"input": inp, "expected": iam}


rng = np.random.default_rng(20261005)
picks = [NAMES[int(i)] for i in rng.choice(len(NAMES), 10, replace=False)]
cases = []
for name in picks[:4]:
    cases += [case(a, name) for a in [0.0, 20.0, 40.0, 60.0, 80.0, 89.9, 90.0, 95.0, -1e-9, -10.0]]
for name in picks[4:6]:
    cases += [case(a, name, upper=1.0) for a in [0.0, 20.0, 30.0, 40.0, 60.0]]
for _ in range(60):
    name = picks[int(rng.integers(len(picks)))]
    cases.append(case(float(rng.uniform(-5, 100)), name, 1.0 if rng.random() < 0.3 else None))

meta = {"reference": f"pvlib.iam.sapm @ pvlib {pvlib.__version__}",
        "modules": "pvlib.pvsystem.retrieve_sam('SandiaMod')", "picked": picks}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
