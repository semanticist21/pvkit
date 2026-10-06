# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy-financial==1.0.0"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for pvkit/economics (every method).

npv / irr: numpy-financial 1.0.0 (npf.npv, npf.irr). The rest has no reference library, so
the reference is the explicit formula (Short, Packey & Holt 1995, NREL/TP-462-5173; SAM
degradation) in Python float64, sums via math.fsum (exactly rounded).
Run: uv run scripts/fixtures/economics.py
"""

import json
import math
from pathlib import Path

import numpy as np
import numpy_financial as npf

ROOT = Path(__file__).resolve().parents[2] / "packages/pvkit/src/models/economics"
rng = np.random.default_rng(20261006)
FORMULA = "explicit formula, Python float64 + math.fsum"


def write(method, cases, reference=FORMULA):
    out = ROOT / method / f"{method}-fixtures.json"
    out.write_text(json.dumps({"meta": {"reference": reference}, "cases": cases}) + "\n")
    print(f"wrote {len(cases)} cases → {out}")


def fl(a):
    return [float(v) for v in a]


def flows(n, conventional=True):
    """Year-0 investment then n years of mostly positive savings."""
    capex = float(rng.uniform(1e3, 5e6))
    cf = [-capex] + fl(capex * rng.uniform(0.02, 0.3) * (1 - rng.uniform(0, 0.02)) ** np.arange(n))
    if not conventional:  # mid-life inverter replacement / decommissioning cost
        for t in rng.integers(1, n + 1, int(rng.integers(1, 3))):
            cf[t] -= capex * float(rng.uniform(0.1, 1.5))
    return cf


# ---- lifetime-energy --------------------------------------------------------------------
def le(e1, d, years):
    annual = [e1 * (1 - d) ** t for t in range(years)]
    return {"input": {"firstYearEnergy": e1, "degradationRate": d, "years": years},
            "expected": {"annual": annual, "total": math.fsum(annual)}}


cases = [le(1000.0, 0.005, 2), le(1000.0, 0.0, 25), le(5000.0, 0.005, 0), le(5000.0, -0.01, 3),
         le(0.0, 0.5, 4)]
for _ in range(55):
    cases.append(le(float(rng.uniform(1, 2e7)), float(rng.uniform(-0.01, 0.03)),
                    int(rng.integers(1, 41))))
write("lifetime-energy", cases)

# ---- bill-savings -----------------------------------------------------------------------
def bs(p, l, pi, pe):
    p, l = np.asarray(p, float), np.asarray(l, float)
    self = np.minimum(p, l)
    pia, pea = np.broadcast_to(pi, p.shape), np.broadcast_to(pe, p.shape)
    avoided = math.fsum(self * pia)
    revenue = math.fsum((p - self) * pea)
    price = lambda x: float(x) if np.isscalar(x) else fl(x)
    return {"input": {"production": fl(p), "load": fl(l), "importPrice": price(pi),
                      "exportPrice": price(pe)},
            "expected": {"selfConsumption": math.fsum(self), "gridExport": math.fsum(p - self),
                         "gridImport": math.fsum(l - self), "avoidedCost": avoided,
                         "exportRevenue": revenue, "savings": avoided + revenue}}


cases = [bs([3, 1], [1, 2], 0.3, 0.1), bs([], [], 0.3, 0.1), bs([0, 0], [1, 1], 0.2, 0.05),
         bs([5, 5], [0, 0], 0.2, 0.0), bs([2, 2, 2], [1, 3, 2], [0.1, 0.4, 0.2], [0.05, 0.1, 0.0])]
for _ in range(55):
    n = int(rng.integers(1, 300))
    hours = np.arange(n) % 24
    p = np.clip(np.sin((hours - 6) / 12 * np.pi), 0, None) * rng.uniform(0, 8) * rng.uniform(0.3, 1, n)
    l = rng.uniform(0.2, 3, n)
    tou = rng.random() < 0.5
    pi = np.where((hours >= 17) & (hours < 21), 0.45, 0.2) if tou else float(rng.uniform(0.05, 0.5))
    pe = rng.uniform(0, 0.15, n) if tou else float(rng.uniform(0, 0.2))
    cases.append(bs(p, l, pi, pe))
write("bill-savings", cases)

# ---- cash-flows -------------------------------------------------------------------------
def cfl(capex, energy, price, esc=0.0, inc=0.0, om=0.0, om_esc=0.0):
    out = [inc - capex] + [e * price * (1 + esc) ** t - om * (1 + om_esc) ** t
                           for t, e in enumerate(energy)]
    return {"input": {"capitalCost": capex, "energy": fl(energy), "energyPrice": price,
                      "priceEscalation": esc, "incentive": inc, "omCost": om, "omEscalation": om_esc},
            "expected": {"cashFlows": out}}


cases = [cfl(10000.0, [5000.0, 4975.0], 0.2), cfl(10000.0, [], 0.2, inc=3000.0),
         cfl(8000.0, [4000.0] * 3, 0.25, 0.03, 2400.0, 100.0, 0.025)]
for _ in range(57):
    n = int(rng.integers(1, 41))
    capex = float(rng.uniform(1e3, 5e6))
    e1 = capex / float(rng.uniform(0.8, 3))
    energy = e1 * (1 - float(rng.uniform(0, 0.01))) ** np.arange(n)
    cases.append(cfl(capex, energy, float(rng.uniform(0.03, 0.4)), float(rng.uniform(-0.02, 0.06)),
                     float(capex * rng.choice([0, 0.1, 0.3])), float(capex * rng.uniform(0, 0.02)),
                     float(rng.uniform(0, 0.04))))
write("cash-flows", cases)

# ---- npv --------------------------------------------------------------------------------
def nv(cf, r):
    return {"input": {"cashFlows": fl(cf), "discountRate": r},
            "expected": {"npv": float(npf.npv(r, cf)), "scale": math.fsum(abs(c) / (1 + r) ** t
                                                                        for t, c in enumerate(cf))}}


cases = [nv([-40_000, 5_000, 8_000, 12_000, 30_000], 0.08), nv([-100, 0, 0, 74], 0.0),
         nv([100], 0.05), nv([-100, 110], 0.1), nv([-1000, 300, 300, 300, 300], -0.05)]
for _ in range(55):
    cases.append(nv(flows(int(rng.integers(1, 41)), rng.random() < 0.7),
                    float(rng.uniform(-0.05, 0.2))))
write("npv", cases, "numpy-financial 1.0.0 npf.npv")

# ---- irr --------------------------------------------------------------------------------
def ir(cf):
    r = float(npf.irr(cf))
    return {"input": {"cashFlows": fl(cf)}, "expected": {"irr": None if math.isnan(r) else r}}


# numpy-financial docstring examples (incl. non-conventional), no-root, zero-rate cases;
# empty / all-zero flows (no rate); closely spaced roots (r = 0.10 & 0.104, 0.10 & 0.102 —
# under 0.5 % apart in ln(1 + r)) alone and with a far root (0.5); zero flows at both ends
cases = [ir([-100, 39, 59, 55, 20]), ir([-100, 0, 0, 74]), ir([-100, 100, 0, -7]),
         ir([-100, 100, 0, 7]), ir([-5, 10.5, 1, -8, 1]), ir([-100, -10]), ir([100, 10]),
         ir([-100, 50, 50]), ir([-100, 300]), ir([]), ir([0, 0, 0]),
         ir([-1, 2.204, -1.2144]), ir([-824.9463784853984, 1816.5319254248473, -1000]),
         ir([-1, 3.704, -4.5204, 1.8216]), ir([0, -100, 110]), ir([-100, 110, 0, 0])]
for _ in range(51):
    cases.append(ir(flows(int(rng.integers(1, 41)), rng.random() < 0.7)))
write("irr", cases, "numpy-financial 1.0.0 npf.irr")

# ---- payback-period ---------------------------------------------------------------------
def pb(cf, r=0.0):
    cum, out = 0.0, math.inf
    for t, c in enumerate(cf):
        d = c / (1 + r) ** t
        if (cum + d >= 0) if cum < 0 else (cum + d > 0):
            out = t - 1 + -cum / d if cum < 0 else 0.0
            break
        cum += d
    return {"input": {"cashFlows": fl(cf), "discountRate": r},
            "expected": {"paybackPeriod": None if math.isinf(out) else out}}


cases = [pb([-1000, 400, 400, 400]), pb([-1000, 500, 500]), pb([0, 10]), pb([-1000, 100, 100]),
         pb([-1000, 400, 400, 400], 0.05), pb([-1000, 600, -500, 2000]), pb([0, -100, 50]),
         pb([0, -100, 150]), pb([0, 0, 10]), pb([0, 0])]
for _ in range(54):
    cases.append(pb(flows(int(rng.integers(1, 41)), rng.random() < 0.7),
                    float(rng.choice([0.0, rng.uniform(0.0, 0.12)]))))
write("payback-period", cases)

# ---- roi --------------------------------------------------------------------------------
cases = [{"input": {"cashFlows": fl(cf)}, "expected": {"roi": math.fsum(cf) / -cf[0]}}
         for cf in [[-1000, 600, 600], [-1000], [-1000, 200, 300]] +
         [flows(int(rng.integers(1, 41)), rng.random() < 0.7) for _ in range(57)]]
write("roi", cases)

# ---- lcoe -------------------------------------------------------------------------------
def lc(costs, energy, r):
    pv = lambda xs: math.fsum(x / (1 + r) ** t for t, x in enumerate(xs))
    return {"input": {"costs": fl(costs), "energy": fl(energy), "discountRate": r},
            "expected": {"lcoe": pv(costs) / pv(energy)}}


cases = [lc([1000, 10, 10], [0, 1000, 1000], 0.0), lc([1000, 10, 10], [0, 1000, 1000], 0.07),
         lc([500, 0], [100, 100], 0.03)]
for _ in range(57):
    n = int(rng.integers(1, 41))
    capex = float(rng.uniform(1e3, 5e6))
    om = capex * rng.uniform(0, 0.02) * (1 + rng.uniform(0, 0.04)) ** np.arange(n)
    energy = capex / rng.uniform(0.8, 3) * (1 - rng.uniform(0, 0.01)) ** np.arange(n)
    cases.append(lc([capex] + fl(om), [0.0] + fl(energy), float(rng.uniform(-0.02, 0.12))))
write("lcoe", cases)
