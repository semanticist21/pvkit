# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for pvkit atmosphere/altitude-pressure from pvlib.atmosphere.alt2pres / pres2alt.

Run: uv run scripts/fixtures/atmosphere-altitude-pressure.py
Writes packages/pvkit/src/models/atmosphere/altitude-pressure/altitude-pressure-fixtures.json
with one case list per function.
"""

import json
from pathlib import Path

import numpy as np
import pvlib

OUT = (Path(__file__).resolve().parents[2]
       / "packages/pvkit/src/models/atmosphere/altitude-pressure/altitude-pressure-fixtures.json")

rng = np.random.default_rng(20261005)
alts = [-430.0, 0.0, 1.0, 1830.14, 5000.0, 8848.0, 20000.0, 40000.0]
alts += [float(a) for a in rng.uniform(-400, 6000, 42)]
press = [101325.0, 110000.0, 82000.0, 50000.0, 30000.0, 5000.0, 100.0, 1.0]
press += [float(p) for p in rng.uniform(40000, 108000, 42)]

alt2pres = [{"input": {"altitude": a}, "expected": float(pvlib.atmosphere.alt2pres(a))}
            for a in alts]
pres2alt = [{"input": {"pressure": p}, "expected": float(pvlib.atmosphere.pres2alt(p))}
            for p in press]

meta = {"reference": f"pvlib.atmosphere.alt2pres / pres2alt @ pvlib {pvlib.__version__}"}
OUT.write_text(json.dumps({"meta": meta, "alt2pres": alt2pres, "pres2alt": pres2alt},
                          indent=2) + "\n")
print(f"wrote {len(alt2pres)} + {len(pres2alt)} cases → {OUT}")
