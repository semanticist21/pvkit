# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for @pvkit/core atmosphere/relative-airmass from pvlib.atmosphere.get_relative_airmass.

Run: uv run scripts/fixtures/atmosphere-relative-airmass.py
Writes packages/core/src/models/atmosphere/relative-airmass/relative-airmass-fixtures.json.
"""

import json
import math
import re
from pathlib import Path

import numpy as np
import pvlib

OUT = (Path(__file__).resolve().parents[2]
       / "packages/core/src/models/atmosphere/relative-airmass/relative-airmass-fixtures.json")


def case(zenith, model):
    am = float(pvlib.atmosphere.get_relative_airmass(np.array([zenith]), model=model)[0])
    # JSON has no NaN: null marks pvlib's NaN (zenith > 90°).
    return {"input": {"solarZenith": zenith, "model": model},
            "expected": None if math.isnan(am) else am}


rng = np.random.default_rng(20261005)
zeniths = [0.0, 1e-6, 30.0, 45.0, 60.0, 75.0, 85.0, 87.5, 89.0, 89.9, 90.0, 90.5, 120.0, -10.0]
zeniths += [float(z) for z in rng.uniform(0, 84, 8)] + [float(z) for z in rng.uniform(84, 90, 4)]
cases = [case(z, m) for m in pvlib.atmosphere.AIRMASS_MODELS for z in zeniths]

meta = {"reference": f"pvlib.atmosphere.get_relative_airmass @ pvlib {pvlib.__version__}",
        "nullMeans": "NaN"}
text = json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n"
# Biome-normalized exponents (1e-06 → 1e-6, 1e+16 → 1e16) so the committed file round-trips.
OUT.write_text(re.sub(r"(\d)e\+?(-?)0*(\d)", r"\1e\2\3", text))
print(f"wrote {len(cases)} cases → {OUT}")
