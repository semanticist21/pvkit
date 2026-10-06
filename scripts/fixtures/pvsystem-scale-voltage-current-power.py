# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for pvkit pvsystem/scale-voltage-current-power.

Reference: pvlib.pvsystem.scale_voltage_current_power.
Run: uv run scripts/fixtures/pvsystem-scale-voltage-current-power.py
"""

import json
from pathlib import Path

import numpy as np
import pandas as pd
import pvlib

METHOD = "scale-voltage-current-power"
OUT = Path(__file__).resolve().parents[2] / f"packages/pvkit/src/models/pvsystem/{METHOD}/{METHOD}-fixtures.json"
COLS = {"i_mp": "iMp", "v_mp": "vMp", "i_sc": "iSc", "v_oc": "vOc", "p_mp": "pMp"}
rng = np.random.default_rng(20261005)


def case(row, series, parallel):
    df = pd.DataFrame([row])
    r = pvlib.pvsystem.scale_voltage_current_power(df, voltage=series, current=parallel).iloc[0]
    inp = {COLS[k]: v for k, v in row.items()} | {"seriesModules": series, "parallelStrings": parallel}
    return {"input": inp, "expected": {COLS[k]: float(r[k]) for k in COLS}}


def module():
    imp, vmp = float(rng.uniform(0, 15)), float(rng.uniform(0, 60))
    return {"i_mp": imp, "v_mp": vmp, "i_sc": imp * float(rng.uniform(1, 1.1)),
            "v_oc": vmp * float(rng.uniform(1, 1.3)), "p_mp": imp * vmp}


cases = [
    case({"i_mp": 9.5, "v_mp": 40.1, "i_sc": 10.1, "v_oc": 48.3, "p_mp": 380.95}, 1, 1),
    case({"i_mp": 9.5, "v_mp": 40.1, "i_sc": 10.1, "v_oc": 48.3, "p_mp": 380.95}, 20, 300),
    case({"i_mp": 0.0, "v_mp": 0.0, "i_sc": 0.0, "v_oc": 0.0, "p_mp": 0.0}, 12, 4),
    case(module(), 0, 0),
]
for _ in range(60):
    cases.append(case(module(), int(rng.integers(1, 40)), int(rng.integers(1, 1000))))

meta = {"reference": f"pvlib.pvsystem.scale_voltage_current_power @ pvlib {pvlib.__version__}"}
OUT.parent.mkdir(exist_ok=True)
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=1) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
