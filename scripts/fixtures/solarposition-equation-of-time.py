# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for pvkit solarposition/equation-of-time from pvlib.solarposition.

Run: uv run scripts/fixtures/solarposition-equation-of-time.py
Writes packages/pvkit/src/models/solarposition/equation-of-time/equation-of-time-fixtures.json.
"""

import json
from pathlib import Path

import numpy as np
import pvlib

OUT = (Path(__file__).resolve().parents[2]
       / "packages/pvkit/src/models/solarposition/equation-of-time/equation-of-time-fixtures.json")

rng = np.random.default_rng(20261005)
# Integer days incl. leap day 366 and out-of-range 0 / 367, plus fractional days.
days = [0.0, 1.0, 2.0, 59.0, 60.0, 81.0, 172.0, 264.0, 355.0, 365.0, 366.0, 367.0, 0.5, 365.75]
days += [float(d) for d in rng.uniform(1, 366, 60)]
cases = [{"input": {"dayOfYear": d}, "expected": {
    "spencer71": float(pvlib.solarposition.equation_of_time_spencer71(d)),
    "pvcdrom": float(pvlib.solarposition.equation_of_time_pvcdrom(d)),
}} for d in days]

meta = {"reference": "pvlib.solarposition.equation_of_time_spencer71 / equation_of_time_pvcdrom"
                     f" @ pvlib {pvlib.__version__}", "unit": "minutes"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
