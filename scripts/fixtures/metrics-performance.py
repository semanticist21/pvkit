# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for @pvkit/core metrics/{performance-ratio,specific-yield,capacity-factor,availability}.

pvlib has no metrics implementation, so the reference is the explicit formula from
IEC 61724-1 and Marion et al. 2005 (NREL/CP-520-37358); temperature-corrected PR from
Dierauf et al. 2013 (NREL/TP-5200-57991). Elementwise terms in numpy float64, sums via
math.fsum (exactly rounded). pvlib is pinned only to share the fixture environment.
Run: uv run scripts/fixtures/metrics-performance.py
"""

import json
import math
from pathlib import Path

import numpy as np
import pvlib

ROOT = Path(__file__).resolve().parents[2] / "packages/core/src/models/metrics"
rng = np.random.default_rng(20261005)


def write(method, cases):
    out = ROOT / method / f"{method}-fixtures.json"
    meta = {"reference": "explicit IEC 61724-1 / NREL formulas, numpy float64 + math.fsum "
                         f"(pvlib {pvlib.__version__} env; pvlib has no metrics)"}
    out.write_text(json.dumps({"meta": meta, "cases": cases}) + "\n")
    print(f"wrote {len(cases)} cases → {out}")


def fl(a):
    return [float(v) for v in a]


def day(n):
    """Synthetic sunny-ish day: irradiation kWh/m² per interval, cell temp °C, energy kWh."""
    shape = np.clip(np.sin(np.linspace(0, np.pi, n)), 0, None) * rng.uniform(0.2, 1.0, n)
    h = shape * rng.uniform(0.05, 1.05)
    t = rng.uniform(-10, 30) + 30 * shape + rng.normal(0, 2, n)
    return h, t


# ---- performance-ratio ------------------------------------------------------------------
def pr(energy, h, pdc0, g_ref=1000.0, t=None, gamma=None, t_ref=None):
    k = pdc0 / (g_ref / 1000)
    inp = {"energy": fl(energy), "poaIrradiation": fl(h), "pdc0Kw": pdc0, "irradRef": g_ref}
    if t is None:
        den = math.fsum(h) * k
    else:
        inp |= {"tempCell": fl(t), "gammaPdc": gamma, "tempRef": t_ref}
        den = math.fsum(np.asarray(h) * (1 + gamma * (np.asarray(t) - t_ref))) * k
    num = math.fsum(energy)
    return {"input": inp, "expected": {"performanceRatio": num / den if den != 0 else None}}


cases = [
    pr([800.0], [2.0], 500.0),  # hand check: 800 / (2 · 500) = 0.8
    pr([800.0], [2.0], 500.0, g_ref=800.0),  # non-STC reference irradiance
    pr([0.0, 0.0], [0.5, 0.5], 10.0),  # zero energy → 0
    pr([-0.01, 3.0, -0.01], [0.0, 0.8, 0.0], 4.0),  # night tare stays negative
    pr([5.0, 6.0], [0.6, 0.7], 10.0, t=[25.0, 25.0], gamma=-0.004, t_ref=25.0),  # == uncorrected
    pr([0.0], [0.0], 5.0),  # 0/0 → NaN (stored as null)
    pr([-0.02, -0.01], [0.0, 0.0], 5.0),  # night tare, ΣH = 0 → NaN, not -Infinity
]
for _ in range(50):
    n = int(rng.integers(1, 96))
    h, _t = day(n)
    pdc0 = float(rng.uniform(0.3, 5e4))
    energy = h * pdc0 * rng.uniform(0.6, 0.9, n)
    cases.append(pr(energy, h, pdc0, float(rng.choice([1000.0, 1000.0, 800.0, 1100.0]))))
for _ in range(50):
    n = int(rng.integers(1, 96))
    h, t = day(n)
    pdc0 = float(rng.uniform(0.3, 5e4))
    gamma = float(rng.uniform(-0.006, -0.002))
    # Typical-year reference: irradiance-weighted mean of an independent "annual" sample, or 25 °C.
    ha, ta = day(500)
    t_ref = 25.0 if rng.random() < 0.3 else math.fsum(ha * ta) / math.fsum(ha)
    energy = h * pdc0 * rng.uniform(0.75, 0.9, n) * (1 + gamma * (t - 25))
    cases.append(pr(energy, h, pdc0, 1000.0, t, gamma, t_ref))
write("performance-ratio", cases)

# ---- specific-yield ---------------------------------------------------------------------
def sy(energy, pdc0):
    return {"input": {"energy": fl(energy), "pdc0Kw": pdc0},
            "expected": {"specificYield": math.fsum(energy) / pdc0}}


cases = [sy([400.0, 600.0], 5.0), sy([], 1.0), sy([0.0] * 24, 3.3), sy([1e16, 1.0, -1e16], 1.0)]
for _ in range(56):
    n = int(rng.integers(1, 400))
    pdc0 = float(rng.uniform(0.3, 5e4))
    cases.append(sy(rng.uniform(-0.01, 1.0, n) * pdc0, pdc0))
write("specific-yield", cases)

# ---- capacity-factor --------------------------------------------------------------------
def cf(energy, nameplate, hours):
    return {"input": {"energy": fl(energy), "nameplateKw": nameplate, "hours": hours},
            "expected": {"capacityFactor": math.fsum(energy) / (nameplate * hours)}}


cases = [cf([8760.0], 5.0, 8760.0), cf([24.0] * 366, 4.0, 8784.0), cf([], 1.0, 1.0),
         cf([1e16, 1.0, -1e16], 1.0, 1.0)]
for _ in range(56):
    n = int(rng.integers(1, 400))
    nameplate = float(rng.uniform(0.3, 5e4))
    step = float(rng.choice([0.25, 1.0, 24.0]))
    cases.append(cf(rng.uniform(0, 0.6, n) * nameplate * step, nameplate, n * step))
write("capacity-factor", cases)

# ---- availability -----------------------------------------------------------------------
def av(a):
    return {"input": {"available": fl(a)}, "expected": {"availability": math.fsum(a) / len(a)}}


cases = [av([1, 1, 0, 1]), av([1]), av([0]), av([0.5] * 7), av([1] * 8760), av([0] * 3 + [1] * 8757)]
for _ in range(54):
    n = int(rng.integers(1, 300))
    if rng.random() < 0.5:
        a = (rng.random(n) > rng.uniform(0, 0.2)).astype(float)
    else:
        a = np.clip(rng.uniform(0.5, 1.3, n), 0, 1)
    cases.append(av(a))
write("availability", cases)
