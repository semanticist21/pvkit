# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for @pvkit/core solarposition/declination from pvlib.solarposition.

Run: uv run scripts/fixtures/solarposition-declination.py
Writes packages/core/src/models/solarposition/declination/declination-fixtures.json.
"""

import json
from pathlib import Path

import numpy as np
import pvlib

OUT = (Path(__file__).resolve().parents[2]
       / "packages/core/src/models/solarposition/declination/declination-fixtures.json")

rng = np.random.default_rng(20261005)
# Integer days incl. leap day 366 and out-of-range 0 / 367, plus fractional days.
days = [0.0, 1.0, 2.0, 59.0, 60.0, 81.0, 172.0, 264.0, 355.0, 365.0, 366.0, 367.0, 0.5, 365.75]
days += [float(d) for d in rng.uniform(1, 366, 60)]
cases = [{"input": {"dayOfYear": d}, "expected": {
    "spencer71": float(np.degrees(pvlib.solarposition.declination_spencer71(d))),
    "cooper69": float(np.degrees(pvlib.solarposition.declination_cooper69(d))),
}} for d in days]

meta = {"reference": "pvlib.solarposition.declination_spencer71 / declination_cooper69 (radians → degrees)"
                     f" @ pvlib {pvlib.__version__}", "unit": "degrees"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
