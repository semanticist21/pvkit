# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for @pvkit/core clearsky/ineichen from pvlib.clearsky.ineichen.

Run: uv run scripts/fixtures/clearsky-ineichen.py
Writes packages/core/src/models/clearsky/ineichen/ineichen-fixtures.json.
"""

import json
from pathlib import Path

import numpy as np
import pvlib

OUT = Path(__file__).resolve().parents[2] / "packages/core/src/models/clearsky/ineichen/ineichen-fixtures.json"


def case(z, am, tl, altitude=0.0, dni_extra=1364.0, perez=False):
    r = pvlib.clearsky.ineichen(z, am, tl, altitude=altitude, dni_extra=dni_extra,
                                perez_enhancement=perez)
    inp = dict(apparentZenith=z, airmassAbsolute=am, linkeTurbidity=tl, altitude=altitude,
               dniExtra=dni_extra, perezEnhancement=perez)
    return {"input": inp, "expected": {k: float(r[k]) for k in ("ghi", "dni", "dhi")}}


def kasten_young(z):
    return float(pvlib.atmosphere.get_relative_airmass(min(z, 89.99), model="kastenyoung1989"))


cases = [
    case(0.0, 1.0, 1.0),
    case(30.0, kasten_young(30.0), 3.0),
    case(60.0, 2.0, 7.0, 4000.0, 1412.0),
    case(60.0, 2.0, 3.0, 1500.0, 1321.0, True),
    # Near / below horizon: cos z → 0, large air mass.
    case(89.0, 26.3, 3.0),
    case(89.9, 36.0, 3.0, perez=True),
    case(90.0, 38.0, 3.0),
    case(95.0, 38.0, 3.0),
    case(120.0, 38.0, 3.0),
    case(-5.0, 1.0, 2.0),
    # Altitude extremes, tiny Linke turbidity.
    case(45.0, 1.0, 0.5, 8848.0),
    case(45.0, 1.4, 2.5, -400.0),
]

rng = np.random.default_rng(20261005)
for i in range(100):
    z = float(rng.uniform(0, 95))
    cases.append(case(z, kasten_young(z) * float(rng.uniform(0.5, 1.0)),
                      float(rng.uniform(1, 8)), float(rng.uniform(0, 4000)),
                      float(rng.uniform(1300, 1420)), bool(i % 4 == 0)))
for _ in range(30):
    z = float(rng.uniform(85, 90))
    cases.append(case(z, kasten_young(z), float(rng.uniform(1, 8)), float(rng.uniform(0, 3000))))

meta = {"reference": f"pvlib.clearsky.ineichen @ pvlib {pvlib.__version__}"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=1) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
