# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for pvkit pvsystem/energy-kwh.

Reference: math.fsum (exactly rounded sum) — pvlib has no energy integrator; energy is
Σ P·Δt as pvlib users compute it with `power.sum() * step_hours / 1000`.
The year-of-minutes series is not stored: it is defined by an xorshift32 stream whose
values (x / 2^32 · scale, one correctly rounded multiply) are bit-identical in JS, so the
test regenerates it from `year` parameters.
Run: uv run scripts/fixtures/pvsystem-energy-kwh.py
"""

import json
import math
from pathlib import Path

import numpy as np
import pvlib

METHOD = "energy-kwh"
OUT = Path(__file__).resolve().parents[2] / f"packages/pvkit/src/models/pvsystem/{METHOD}/{METHOD}-fixtures.json"
M = 0xFFFFFFFF


def year_series(seed, n, scale, day_start, day_end):
    x, out = seed, []
    for i in range(n):
        x ^= (x << 13) & M
        x ^= x >> 17
        x ^= (x << 5) & M
        m = i % 1440
        out.append(x / 4294967296 * scale if day_start <= m < day_end else 0.0)
    return out


year = {"seed": 2463534242, "n": 525600, "scale": 6000.5, "dayStart": 360, "dayEnd": 1080,
        "stepHours": 1 / 60}
ys = year_series(year["seed"], year["n"], year["scale"], year["dayStart"], year["dayEnd"])
year["expected"] = {"energyKwh": math.fsum(ys) * year["stepHours"] / 1000}
naive = 0.0
for v in ys:
    naive += v
year["naiveEnergyKwh"] = naive * year["stepHours"] / 1000
year["numpyEnergyKwh"] = float(np.sum(ys)) * year["stepHours"] / 1000


def case(power, step):
    return {"input": {"power": power, "stepHours": step},
            "expected": {"energyKwh": math.fsum(power) * step / 1000}}


rng = np.random.default_rng(20261005)
cases = [
    case([], 1.0),
    case([0.0] * 24, 1.0),
    case([1000.0], 1.0),  # 1 kW for 1 h
    case([0.1] * 600, 1 / 60),
    case([-15.0, -15.0, 120.0, 4000.0, -15.0], 0.25),  # night tare stays negative
    case([1e16, 1.0, -1e16], 1.0),  # cancellation a naive sum loses
]
for _ in range(60):
    n = int(rng.integers(1, 100))
    step = float(rng.choice([1 / 60, 5 / 60, 0.25, 0.5, 1.0]))
    cases.append(case([float(v) for v in rng.uniform(-20, 1e6, n)], step))

meta = {"reference": f"math.fsum(power) * stepHours / 1000 (numpy/pvlib {pvlib.__version__} env)",
        "year": year}
OUT.parent.mkdir(exist_ok=True)
OUT.write_text(json.dumps({"meta": meta, "cases": cases}) + "\n")
print(f"wrote {len(cases)} cases + year → {OUT}; naive-fsum rel diff",
      abs(year["naiveEnergyKwh"] / year["expected"]["energyKwh"] - 1))
