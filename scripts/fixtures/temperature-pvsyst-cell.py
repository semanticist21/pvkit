# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for pvkit temperature/pvsyst-cell from pvlib.temperature.pvsyst_cell.

Run: uv run scripts/fixtures/temperature-pvsyst-cell.py
Writes packages/pvkit/src/models/temperature/pvsyst-cell/pvsyst-cell-fixtures.json and the
TEMPERATURE_MODEL_PARAMETERS['pvsyst'] presets as pvsyst-cell-parameters.ts.
"""

import json
import re
from pathlib import Path

import numpy as np
import pvlib
from pvlib.temperature import TEMPERATURE_MODEL_PARAMETERS, pvsyst_cell

DIR = Path(__file__).resolve().parents[2] / "packages/pvkit/src/models/temperature/pvsyst-cell"
camel = lambda s: re.sub(r"_(\w)", lambda m: m.group(1).upper(), s)  # noqa: E731
PRESETS = TEMPERATURE_MODEL_PARAMETERS["pvsyst"]


def case(poa, temp_air, wind, u_c, u_v, eta, alpha):
    inp = dict(poaGlobal=poa, tempAir=temp_air, windSpeed=wind, uC=u_c, uV=u_v,
               moduleEfficiency=eta, alphaAbsorption=alpha)
    t = float(pvsyst_cell(poa, temp_air, wind_speed=wind, u_c=u_c, u_v=u_v,
                          module_efficiency=eta, alpha_absorption=alpha))
    return {"input": inp, "expected": {"cellTemperature": t}}


cases = []
for p in PRESETS.values():
    for poa, ta, ws in [(1000.0, 25.0, 1.0), (0.0, 15.0, 3.0), (-5.0, -10.0, 2.0),
                        (1400.0, 50.0, 0.0), (800.0, -40.0, 30.0)]:
        cases.append(case(poa, ta, ws, float(p["u_c"]), float(p["u_v"]), 0.1, 0.9))
# Wind-dependent loss factors (PVsyst docs suggest u_c=25, u_v=1.2 for measured wind).
cases.append(case(800.0, 20.0, 5.0, 25.0, 1.2, 0.2, 0.9))
cases.append(case(1000.0, 35.0, 12.0, 25.0, 1.2, 0.22, 0.95))

rng = np.random.default_rng(20261005)
for _ in range(100):
    cases.append(case(
        float(rng.uniform(0, 1400)), float(rng.uniform(-30, 50)), float(rng.uniform(0, 20)),
        float(rng.uniform(10, 35)), float(rng.uniform(0, 3)), float(rng.uniform(0.05, 0.25)),
        float(rng.uniform(0.8, 0.98)),
    ))

meta = {"reference": f"pvlib.temperature.pvsyst_cell @ pvlib {pvlib.__version__}"}
(DIR / "pvsyst-cell-fixtures.json").write_text(
    json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")

rows = "\n".join(
    f"  {camel(k)}: {{ uC: {float(v['u_c'])!r}, uV: {float(v['u_v'])!r} }}," for k, v in PRESETS.items()
)
(DIR / "pvsyst-cell-parameters.ts").write_text(f'''/**
 * PVsyst cell-temperature presets (PVsyst help, "Array thermal losses").
 * Generated from pvlib {pvlib.__version__} `pvlib.temperature.TEMPERATURE_MODEL_PARAMETERS["pvsyst"]`
 * by `scripts/fixtures/temperature-pvsyst-cell.py`. Do not hand-edit.
 */
export const PVSYST_TEMPERATURE_PARAMETERS = {{
{rows}
}} as const;
''')
print(f"wrote {len(cases)} cases → {DIR}")
