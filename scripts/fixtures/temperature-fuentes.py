# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for @pvkit/core temperature/fuentes from pvlib.temperature.fuentes.

pvlib takes whole pandas Series; pvkit's fuentes is one step. Each case records the
per-step inputs pvlib saw, including the prior state: prevTempModule (pvlib's
previous output, 20 °C before the first step), prevPoaGlobal (0 before the first step)
and timestepSeconds (pvlib reuses the second interval for the first step).

Run: uv run scripts/fixtures/temperature-fuentes.py
Writes packages/core/src/models/temperature/fuentes/fuentes-fixtures.json.
"""

import json
from pathlib import Path

import numpy as np
import pandas as pd
import pvlib
from pvlib.temperature import fuentes

OUT = Path(__file__).resolve().parents[2] / "packages/core/src/models/temperature/fuentes/fuentes-fixtures.json"
rng = np.random.default_rng(20261005)
DEFAULTS = dict(module_height=5.0, wind_height=9.144, emissivity=0.84, absorption=0.83,
                surface_tilt=30.0, module_width=0.31579, module_length=1.2)
CAMEL = dict(module_height="moduleHeight", wind_height="windHeight", emissivity="emissivity",
             absorption="absorption", surface_tilt="surfaceTilt", module_width="moduleWidth",
             module_length="moduleLength")


def series(series_id, minutes, poa, temp_air, wind, noct, **params):
    p = DEFAULTS | params
    idx = pd.Timestamp("2025-06-21", tz="UTC") + pd.to_timedelta(np.cumsum(minutes), unit="min")
    s = lambda v: pd.Series(np.asarray(v, dtype=float), index=idx)  # noqa: E731
    out = fuentes(s(poa), s(temp_air), s(wind), noct, **p).to_numpy()
    dt = idx.to_series().diff().dt.total_seconds().to_numpy(copy=True)  # as pvlib
    dt[0] = dt[1]
    cases = []
    for i in range(len(idx)):
        inp = dict(poaGlobal=float(poa[i]), tempAir=float(temp_air[i]), windSpeed=float(wind[i]),
                   noctInstalled=float(noct),
                   prevTempModule=20.0 if i == 0 else float(out[i - 1]),
                   prevPoaGlobal=0.0 if i == 0 else float(poa[i - 1]),
                   timestepSeconds=float(dt[i]))
        inp |= {CAMEL[k]: float(v) for k, v in p.items()}
        cases.append({"series": series_id, "input": inp,
                      "expected": {"moduleTemperature": float(out[i])}})
    return cases


def day(n, step_h, peak=1000.0):
    hours = np.arange(n) * step_h
    sun = np.clip(np.sin((hours % 24 - 6) / 12 * np.pi), 0, None)
    poa = peak * sun * rng.uniform(0.6, 1.0, n)
    temp_air = 15 + 12 * sun + rng.normal(0, 1, n)
    return poa, temp_air


cases = []
# 1. Two hourly days, PVWatts rack-mount NOCT 45, default geometry; calm-to-breezy wind.
poa, ta = day(48, 1.0)
cases += series(0, np.full(48, 60), poa, ta, rng.uniform(0, 6, 48), 45.0)
# 2. 5-minute midday ramp incl. cloud edges, roof-mount NOCT 49 (> 48 °C → heavier cap),
#    zero wind steps.
n = 36
poa = np.clip(800 + 300 * rng.standard_normal(n), 0, 1300)
wind = np.where(rng.random(n) < 0.3, 0.0, rng.uniform(0, 3, n))
cases += series(1, np.full(n, 5), poa, rng.uniform(20, 35, n), wind, 49.0)
# 3. Irregular timesteps (1 min … 3 h), custom geometry/optics, NOCT 55, cold air.
n = 30
minutes = rng.choice([1, 5, 15, 60, 180], n)
cases += series(2, minutes, rng.uniform(0, 1200, n), rng.uniform(-25, 10, n),
                rng.uniform(0, 10, n), 55.0, module_height=1.5, wind_height=10.0,
                emissivity=0.9, absorption=0.9, surface_tilt=10.0, module_width=1.0,
                module_length=2.0)
# 4. Night-to-dawn with gale winds (turbulent Re > 1.2e5), NOCT 42, hot desert air.
n = 30
poa = np.concatenate([np.zeros(12), np.linspace(0, 1100, 18)])
cases += series(3, np.full(n, 10), poa, rng.uniform(25, 48, n), rng.uniform(8, 25, n), 42.0,
                surface_tilt=60.0)

meta = {"reference": f"pvlib.temperature.fuentes @ pvlib {pvlib.__version__}",
        "note": "per-step inputs of pvlib series runs; 'series' groups consecutive steps"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
