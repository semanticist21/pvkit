# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for @pvkit/core atmosphere/bird-hulstrom80-aod-bb from
pvlib.atmosphere.bird_hulstrom80_aod_bb.

Run: uv run scripts/fixtures/atmosphere-bird-hulstrom80-aod-bb.py
Writes packages/core/src/models/atmosphere/bird-hulstrom80-aod-bb/
bird-hulstrom80-aod-bb-fixtures.json.
"""

import json
from pathlib import Path

import numpy as np
import pvlib

OUT = (Path(__file__).resolve().parents[2] / "packages/core/src/models/atmosphere/"
       "bird-hulstrom80-aod-bb/bird-hulstrom80-aod-bb-fixtures.json")


def case(a380, a500):
    return {"input": {"aod380": a380, "aod500": a500},
            "expected": float(pvlib.atmosphere.bird_hulstrom80_aod_bb(a380, a500))}


rng = np.random.default_rng(20261005)
cases = [case(0.0, 0.0), case(0.15, 0.1), case(2.0, 1.5), case(0.01, 0.005)]
cases += [case(float(rng.uniform(0, 2)), float(rng.uniform(0, 1.5))) for _ in range(46)]

meta = {"reference": f"pvlib.atmosphere.bird_hulstrom80_aod_bb @ pvlib {pvlib.__version__}"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
