# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# ///
"""Fixtures for @pvkit/core pvsystem/{pvwatts-dc, pvwatts-losses, pvwatts-inverter}.

References: pvlib.pvsystem.pvwatts_dc, pvlib.pvsystem.pvwatts_losses, pvlib.inverter.pvwatts.
Run: uv run scripts/fixtures/pvsystem-pvwatts.py
Writes <method>-fixtures.json into packages/core/src/models/pvsystem/<method>/.
"""

import json
from pathlib import Path

import numpy as np
import pvlib

DIR = Path(__file__).resolve().parents[2] / "packages/core/src/models/pvsystem"
rng = np.random.default_rng(20261005)
u = lambda lo, hi: float(rng.uniform(lo, hi))  # noqa: E731


def write(method, ref, cases):
    out = DIR / method / f"{method}-fixtures.json"
    meta = {"reference": f"{ref} @ pvlib {pvlib.__version__}"}
    out.write_text(json.dumps({"meta": meta, "cases": cases}, indent=1) + "\n")
    print(f"wrote {len(cases)} cases → {out}")


# --- pvwatts_dc (k=None: Marion adjustment not implemented) ---
def dc(e, t, pdc0, gamma, tref=25.0):
    r = pvlib.pvsystem.pvwatts_dc(e, t, pdc0, gamma, temp_ref=tref, k=None, cap_adjustment=False)
    inp = dict(effectiveIrradiance=e, tempCell=t, pdc0=pdc0, gammaPdc=gamma, tempRef=tref)
    return {"input": inp, "expected": {"pdc": float(r)}}


dc_cases = [
    dc(1000.0, 25.0, 1000.0, -0.004),  # STC → pdc0
    dc(0.0, 25.0, 5000.0, -0.0035),  # night
    dc(-5.0, 10.0, 5000.0, -0.0035),  # negative sensor noise: pvlib passes it through
    dc(1500.0, 90.0, 1e6, -0.006),
    dc(1e-6, -40.0, 250.0, -0.002),
    dc(800.0, 45.0, 4000.0, 0.0),
    dc(1000.0, 25.0, 0.0, -0.004),
]
for _ in range(100):
    dc_cases.append(dc(u(0, 1500), u(-40, 90), u(100, 1e6), u(-0.006, -0.002), u(20, 30)))
write("pvwatts-dc", "pvlib.pvsystem.pvwatts_dc(k=None, cap_adjustment=False)", dc_cases)

# --- pvwatts_losses ---
NAMES = [("soiling", "soiling"), ("shading", "shading"), ("snow", "snow"),
         ("mismatch", "mismatch"), ("wiring", "wiring"), ("connections", "connections"),
         ("lid", "lid"), ("nameplate_rating", "nameplateRating"), ("age", "age"),
         ("availability", "availability")]
DEFAULTS = dict(soiling=2.0, shading=3.0, snow=0.0, mismatch=2.0, wiring=2.0, connections=0.5,
                lid=1.5, nameplate_rating=1.0, age=0.0, availability=3.0)


def losses(**kw):
    p = {**DEFAULTS, **kw}
    r = pvlib.pvsystem.pvwatts_losses(**p)
    return {"input": {ts: p[py] for py, ts in NAMES}, "expected": {"losses": float(r)}}


loss_cases = [
    losses(),  # pvlib defaults ≈ 14.08 %
    losses(**{k: 0.0 for k in DEFAULTS}),
    losses(soiling=100.0),  # total loss
    losses(**{k: 100.0 for k in DEFAULTS}),
    losses(nameplate_rating=-2.0),  # gain
    losses(snow=50.0, age=20.0),
]
for _ in range(60):
    loss_cases.append(losses(**{k: u(0, 30) for k in DEFAULTS}))
write("pvwatts-losses", "pvlib.pvsystem.pvwatts_losses", loss_cases)


# --- inverter.pvwatts ---
def inv(pdc, pdc0, nom=0.96, ref=0.9637):
    r = pvlib.inverter.pvwatts(pdc, pdc0, eta_inv_nom=nom, eta_inv_ref=ref)
    inp = dict(pdc=pdc, pdc0=pdc0, etaInvNom=nom, etaInvRef=ref)
    return {"input": inp, "expected": {"pac": float(r)}}


inv_cases = [
    inv(0.0, 5000.0),  # divide-by-zero guard → 0
    inv(-50.0, 5000.0),  # negative DC → clamped to 0
    inv(10.0, 5000.0),  # zeta < 0.006 → eta < 0 → 0
    inv(30.0, 5000.0),  # zeta = 0.006 boundary
    inv(5000.0, 5000.0),  # nominal
    inv(5000.0 * 0.96 / 0.9637, 5000.0),
    inv(8000.0, 5000.0),  # clipped at pac0
    inv(1e9, 1e6),
    inv(1.0, 1.0, 0.99, 0.99),
]
for _ in range(80):
    pdc0 = u(200, 1e6)
    inv_cases.append(inv(u(0, 1.3) * pdc0, pdc0, u(0.9, 0.99), u(0.95, 0.99)))
for _ in range(20):  # low-power tail
    pdc0 = u(200, 1e6)
    inv_cases.append(inv(u(0, 0.02) * pdc0, pdc0))
write("pvwatts-inverter", "pvlib.inverter.pvwatts", inv_cases)
