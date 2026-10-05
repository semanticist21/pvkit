# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# ///
"""Fixtures for @pvkit/core temperature/sapm from pvlib.temperature.sapm_{cell,module}.

Run: uv run scripts/fixtures/temperature-sapm.py
Writes packages/core/src/models/temperature/sapm/sapm-fixtures.json and the
TEMPERATURE_MODEL_PARAMETERS['sapm'] presets as sapm-parameters.ts.
"""

import json
import re
from pathlib import Path

import numpy as np
import pvlib
from pvlib.temperature import TEMPERATURE_MODEL_PARAMETERS, sapm_cell, sapm_module

DIR = Path(__file__).resolve().parents[2] / "packages/core/src/models/temperature/sapm"
camel = lambda s: re.sub(r"_(\w)", lambda m: m.group(1).upper(), s)  # noqa: E731
PRESETS = TEMPERATURE_MODEL_PARAMETERS["sapm"]


def case(poa, temp_air, wind, a, b, delta_t, irrad_ref=1000.0):
    inp = dict(poaGlobal=poa, tempAir=temp_air, windSpeed=wind, a=a, b=b, deltaT=delta_t,
               irradRef=irrad_ref)
    exp = dict(
        cell=float(sapm_cell(poa, temp_air, wind, a, b, delta_t, irrad_ref=irrad_ref)),
        module=float(sapm_module(poa, temp_air, wind, a, b)),
    )
    return {"input": inp, "expected": exp}


cases = []
for p in PRESETS.values():
    a, b, dt = float(p["a"]), float(p["b"]), float(p["deltaT"])
    # STC-ish, zero/negative irradiance, calm and gale wind, temperature extremes, other E0.
    for poa, ta, ws in [(1000.0, 25.0, 1.0), (1000.0, 10.0, 0.0), (0.0, 15.0, 3.0),
                        (-5.0, -10.0, 2.0), (1400.0, 50.0, 0.0), (800.0, -40.0, 30.0),
                        (200.0, 0.0, 15.0)]:
        cases.append(case(poa, ta, ws, a, b, dt))
    cases.append(case(900.0, 30.0, 2.0, a, b, dt, irrad_ref=800.0))

rng = np.random.default_rng(20261005)
for _ in range(100):
    cases.append(case(
        float(rng.uniform(0, 1400)), float(rng.uniform(-30, 50)), float(rng.uniform(0, 20)),
        float(rng.uniform(-4, -2.5)), float(rng.uniform(-0.1, -0.03)), float(rng.uniform(0, 4)),
        float(rng.choice([1000.0, 800.0, 1200.0])),
    ))

meta = {"reference": f"pvlib.temperature.sapm_cell / sapm_module @ pvlib {pvlib.__version__}"}
(DIR / "sapm-fixtures.json").write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")

rows = "\n".join(
    f"  {camel(k)}: {{ a: {float(v['a'])!r}, b: {float(v['b'])!r}, deltaT: {v['deltaT']!r} }},"
    for k, v in PRESETS.items()
)
(DIR / "sapm-parameters.ts").write_text(f'''/**
 * SAPM temperature-model presets — King et al. (2004), SAND2004-3535, Table 1.
 * Generated from pvlib {pvlib.__version__} `pvlib.temperature.TEMPERATURE_MODEL_PARAMETERS["sapm"]`
 * by `scripts/fixtures/temperature-sapm.py`. Do not hand-edit.
 */
export const SAPM_TEMPERATURE_PARAMETERS = {{
{rows}
}} as const;
''')
print(f"wrote {len(cases)} cases → {DIR}")
