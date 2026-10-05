# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# ///
"""Fixtures for @pvkit/core atmosphere/kasten96-lt from pvlib.atmosphere.kasten96_lt.

Run: uv run scripts/fixtures/atmosphere-kasten96-lt.py
Writes packages/core/src/models/atmosphere/kasten96-lt/kasten96-lt-fixtures.json.
"""

import json
from pathlib import Path

import numpy as np
import pvlib

OUT = (Path(__file__).resolve().parents[2]
       / "packages/core/src/models/atmosphere/kasten96-lt/kasten96-lt-fixtures.json")


def case(am, pw, aod):
    return {"input": {"airmassAbsolute": am, "precipitableWater": pw, "aodBb": aod},
            "expected": float(pvlib.atmosphere.kasten96_lt(am, pw, aod))}


rng = np.random.default_rng(20261005)
cases = [case(1.0, 1.0, 0.1), case(1.0, 0.0, 0.0), case(38.0, 0.1, 0.0), case(38.0, 7.0, 1.0),
         case(0.5, 3.0, 0.05), case(2.0, 1.4164, 0.0843), case(10.0, 5.0, 0.5)]
cases += [case(float(rng.uniform(0.5, 38)), float(rng.uniform(0.1, 7)),
               float(rng.uniform(0, 1))) for _ in range(43)]

meta = {"reference": f"pvlib.atmosphere.kasten96_lt @ pvlib {pvlib.__version__}"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
