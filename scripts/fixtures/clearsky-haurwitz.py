# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# ///
"""Fixtures for @pvkit/core clearsky/haurwitz from pvlib.clearsky.haurwitz.

Run: uv run scripts/fixtures/clearsky-haurwitz.py
Writes packages/core/src/models/clearsky/haurwitz/haurwitz-fixtures.json.
"""

import json
from pathlib import Path

import numpy as np
import pandas as pd
import pvlib

OUT = Path(__file__).resolve().parents[2] / "packages/core/src/models/clearsky/haurwitz/haurwitz-fixtures.json"


def case(z):
    r = pvlib.clearsky.haurwitz(pd.Series([z])).iloc[0]
    return {"input": {"apparentZenith": z}, "expected": {"ghi": float(r["ghi"])}}


# Zenith, horizon, below horizon, negative zenith, near-horizon sweep.
fixed = [0.0, 30.0, 60.0, 80.0, -10.0, 89.0, 89.9, 89.999, 90.0, 90.001, 95.0, 120.0, 180.0]
rng = np.random.default_rng(20261005)
cases = [case(z) for z in fixed]
cases += [case(float(z)) for z in rng.uniform(0, 100, 40)]
cases += [case(float(z)) for z in rng.uniform(85, 90, 20)]

meta = {"reference": f"pvlib.clearsky.haurwitz @ pvlib {pvlib.__version__}"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=1) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
