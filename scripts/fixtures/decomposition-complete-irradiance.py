# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# ///
"""Fixtures for @pvkit/core decomposition/complete-irradiance from
pvlib.irradiance.complete_irradiance.

Run: uv run scripts/fixtures/decomposition-complete-irradiance.py
Writes packages/core/src/models/decomposition/complete-irradiance/complete-irradiance-fixtures.json.
NaN outputs are stored as null.
"""

import json
import math
from pathlib import Path

import numpy as np
import pandas as pd
import pvlib

OUT = (Path(__file__).resolve().parents[2] / "packages/core/src/models/decomposition/"
       "complete-irradiance/complete-irradiance-fixtures.json")


def num(x):
    x = float(x)
    return None if math.isnan(x) else x


def case(zenith, ghi=None, dhi=None, dni=None, dni_clear=None):
    idx = pd.DatetimeIndex([pd.Timestamp("2024-06-01", tz="UTC")])
    s = lambda v: None if v is None else pd.Series([v], index=idx)  # noqa: E731
    r = pvlib.irradiance.complete_irradiance(
        pd.Series([zenith], index=idx), ghi=s(ghi), dhi=s(dhi), dni=s(dni),
        dni_clear=s(dni_clear)).iloc[0]
    inp = {"solarZenith": zenith}
    for k, v in (("ghi", ghi), ("dhi", dhi), ("dni", dni), ("dniClear", dni_clear)):
        if v is not None:
            inp[k] = v
    return {"input": inp, "expected": {k: num(r[k]) for k in ("ghi", "dhi", "dni")}}


cases = [
    case(30.0, ghi=800.0, dhi=100.0),
    case(30.0, ghi=100.0, dhi=150.0),               # negative DNI → NaN
    case(88.0, ghi=10.0, dhi=10.0),                 # zero DNI kept at the 88° cutoff
    case(88.5, ghi=12.0, dhi=10.0),                 # non-zero DNI ≥ 88° → NaN
    case(85.0, ghi=60.0, dhi=20.0, dni_clear=100.0),  # clipped to 1.1·dniClear
    case(85.0, ghi=40.0, dhi=20.0, dni_clear=300.0),  # under the clear-sky limit
    case(79.0, ghi=60.0, dhi=20.0, dni_clear=10.0),   # below 80°: no clipping
    case(95.0, ghi=0.0, dhi=0.0),
    case(30.0, dni=700.0, dhi=100.0),
    case(89.9, dni=50.0, dhi=10.0),
    case(30.0, dni=700.0, ghi=800.0),
    case(60.0, dni=900.0, ghi=300.0),               # negative DHI passes through
]
rng = np.random.default_rng(20261005)
for _ in range(25):
    z, g = float(rng.uniform(0, 92)), float(rng.uniform(0, 1100))
    d = float(rng.uniform(0, 1.1) * g)
    cases.append(case(z, ghi=g, dhi=d, dni_clear=float(rng.uniform(0, 900))
                      if rng.random() < 0.5 else None))
for _ in range(10):
    cases.append(case(float(rng.uniform(0, 95)), dni=float(rng.uniform(0, 1000)),
                      dhi=float(rng.uniform(0, 400))))
for _ in range(10):
    cases.append(case(float(rng.uniform(0, 95)), dni=float(rng.uniform(0, 1000)),
                      ghi=float(rng.uniform(0, 1100))))

meta = {"reference": f"pvlib.irradiance.complete_irradiance @ pvlib {pvlib.__version__}",
        "nan": "null"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
