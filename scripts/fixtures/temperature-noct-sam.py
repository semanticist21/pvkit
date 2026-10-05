# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for @pvkit/core temperature/noct-sam from pvlib.temperature.noct_sam.

Run: uv run scripts/fixtures/temperature-noct-sam.py
Writes packages/core/src/models/temperature/noct-sam/noct-sam-fixtures.json.
"""

import json
from pathlib import Path

import numpy as np
import pvlib
from pvlib.temperature import noct_sam

OUT = Path(__file__).resolve().parents[2] / "packages/core/src/models/temperature/noct-sam/noct-sam-fixtures.json"


def case(poa, temp_air, wind, noct, eta, eff=None, ta=0.9, height=1, standoff=4.0):
    inp = dict(poaGlobal=poa, tempAir=temp_air, windSpeed=wind, noct=noct, moduleEfficiency=eta)
    if eff is not None:
        inp["effectiveIrradiance"] = eff
    inp |= dict(transmittanceAbsorptance=ta, arrayHeight=height, mountStandoff=standoff)
    # numpy scalars: x/0 → inf/nan like pvlib's array path (plain floats would raise).
    t = float(noct_sam(np.float64(poa), temp_air, wind, noct, eta,
                       effective_irradiance=None if eff is None else np.float64(eff),
                       transmittance_absorptance=ta, array_height=height,
                       mount_standoff=standoff))
    return {"input": inp, "expected": {"cellTemperature": t}}


cases = [
    case(800.0, 20.0, 1.0, 45.0, 0.2),
    case(1000.0, 25.0, 0.0, 45.0, 0.2),
    case(0.0, 15.0, 3.0, 45.0, 0.2),
    case(-5.0, -10.0, 2.0, 48.0, 0.18),
    case(1400.0, 50.0, 0.0, 55.0, 0.15),
    case(800.0, -40.0, 30.0, 44.0, 0.21),
    case(900.0, 30.0, 4.0, 46.0, 0.2, height=2),
    case(900.0, 30.0, 4.0, 46.0, 0.2, eff=850.0),
    case(0.0, 30.0, 4.0, 46.0, 0.2, eff=10.0),  # eff/poa = inf → heat loss 1, init 0 → T_air
]
# Every mount_standoff interval boundary (pvlib's <, <= choices).
for s in [-1.0, 0.0, 0.25, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 3.6, 10.0]:
    cases.append(case(900.0, 25.0, 2.0, 45.0, 0.2, standoff=s))

rng = np.random.default_rng(20261005)
for _ in range(100):
    poa = float(rng.uniform(1, 1400))
    cases.append(case(
        poa, float(rng.uniform(-30, 50)), float(rng.uniform(0, 20)), float(rng.uniform(40, 55)),
        float(rng.uniform(0.1, 0.24)),
        eff=float(poa * rng.uniform(0.8, 1.0)) if rng.random() < 0.3 else None,
        ta=float(rng.uniform(0.8, 0.95)), height=int(rng.choice([1, 2])),
        standoff=float(rng.uniform(0, 5)),
    ))

meta = {"reference": f"pvlib.temperature.noct_sam @ pvlib {pvlib.__version__}"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
