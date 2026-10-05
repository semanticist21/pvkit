# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# ///
"""Fixtures for @pvkit/core losses/combine-loss-factors from pvlib.pvsystem.combine_loss_factors.

Run: uv run scripts/fixtures/losses-combine-loss-factors.py
Writes packages/core/src/models/losses/combine-loss-factors/combine-loss-factors-fixtures.json.
"""

import json
from pathlib import Path

import numpy as np
import pandas as pd
import pvlib

OUT = (Path(__file__).resolve().parents[2]
       / "packages/core/src/models/losses/combine-loss-factors/combine-loss-factors-fixtures.json")
INDEX = pd.DatetimeIndex([pd.Timestamp("2024-01-01", tz="UTC")])


def case(losses):
    series = [pd.Series([f], index=INDEX) for f in losses]
    r = pvlib.pvsystem.combine_loss_factors(INDEX, *series, fill_method="ffill")
    return {"input": [float(f) for f in losses], "expected": float(np.ravel(np.asarray(r))[0])}  # empty → scalar 1 - 1


cases = [
    case([]),
    case([0.0]),
    case([1.0]),
    case([0.02, 0.03]),  # pvlib docs-style example
    case([0.0, 0.0, 0.0]),
    case([1.0, 0.5, 0.2]),
    case([0.5, 0.5]),
    case([1e-12, 1e-12]),
    case([-0.05, 0.1]),  # gain (negative loss) is allowed by the formula
    case([0.999999, 0.999999]),
    case([0.14] * 10),
]
rng = np.random.default_rng(20261005)
for _ in range(50):
    n = int(rng.integers(1, 12))
    cases.append(case(rng.uniform(0, 0.3, n)))

meta = {"reference": f"pvlib.pvsystem.combine_loss_factors (fill_method='ffill') @ pvlib "
                     f"{pvlib.__version__}, one-sample Series per loss"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=1) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
