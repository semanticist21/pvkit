# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for @pvkit/core losses/soiling-hsu from pvlib.soiling.hsu.

Run: uv run scripts/fixtures/losses-soiling-hsu.py
Writes packages/core/src/models/losses/soiling-hsu/soiling-hsu-fixtures.json.

Each case is a whole series: pvlib runs once on it, and every step records the per-step
TS input (trailing-window rainfall, timestep, PM, tilt, ...) plus pvlib's output. The test
chains the step function over the steps, feeding back its own returned mass.
"""

import json
from pathlib import Path

import numpy as np
import pandas as pd
import pvlib

OUT = (Path(__file__).resolve().parents[2]
       / "packages/core/src/models/losses/soiling-hsu/soiling-hsu-fixtures.json")


def scenario(name, rain, *, cleaning_threshold, surface_tilt, pm2_5, pm10,
             depo_veloc=None, rain_accum_period=pd.Timedelta("1h")):
    dv = depo_veloc or {"2_5": 0.0009, "10": 0.004}
    pm25 = np.broadcast_to(np.asarray(pm2_5, dtype=float), rain.shape)
    pm10a = np.broadcast_to(np.asarray(pm10, dtype=float), rain.shape)
    r = pvlib.soiling.hsu(rain, cleaning_threshold, surface_tilt,
                          pm25 if np.ndim(pm2_5) else pm2_5, pm10a if np.ndim(pm10) else pm10,
                          depo_veloc=dict(dv), rain_accum_period=rain_accum_period)
    accum = rain.rolling(rain_accum_period, closed="right").sum()
    dt = (rain.index[1:] - rain.index[:-1]) / pd.Timedelta(milliseconds=1)
    dt_ms = np.append(dt[0], dt).astype(int)  # pvlib: interval before step 0 = first interval
    steps = []
    for i in range(len(rain)):
        inp = {"rainfallAccumulated": float(accum.iloc[i]), "timestepMs": int(dt_ms[i]),
               "cleaningThreshold": cleaning_threshold, "surfaceTilt": surface_tilt,
               "pm25": float(pm25[i]), "pm10": float(pm10a[i]),
               "depoVelocPm25": dv["2_5"], "depoVelocPm10": dv["10"]}
        steps.append({"input": inp, "expected": {"soilingRatio": float(r.iloc[i])}})
    return {"name": name, "rainAccumPeriodMs": int(rain_accum_period / pd.Timedelta(milliseconds=1)),
            "steps": steps}


rng = np.random.default_rng(20261005)


def rain_series(index, p_rain, scale):
    n = len(index)
    wet = rng.random(n) < p_rain
    return pd.Series(np.where(wet, rng.exponential(scale, n), 0.0), index=index)


hourly = pd.date_range("2024-01-01", periods=240, freq="1h", tz="UTC")
# Irregular sampling: pvlib uses each step's own interval.
irregular = pd.DatetimeIndex(pd.Timestamp("2024-05-01", tz="UTC")
                             + pd.to_timedelta(np.cumsum(rng.integers(5, 180, 120)), unit="min"))

cases = [
    # Realistic urban PM (µg/m³ → g/m³), 1 h window, 30° tilt.
    scenario("hourly-urban", rain_series(hourly, 0.03, 2.0), cleaning_threshold=1.0,
             surface_tilt=30.0, pm2_5=35e-6, pm10=80e-6),
    # Heavy dust, horizontal, 24 h window: mass grows towards the erf floor (SR → 0.6563).
    scenario("hourly-dust-24h", rain_series(hourly, 0.01, 6.0), cleaning_threshold=5.0,
             surface_tilt=0.0, pm2_5=2e-3, pm10=8e-3, rain_accum_period=pd.Timedelta("24h")),
    # Time-varying PM, pm10 < pm2_5 at some steps (coarse fraction clamped to 0).
    scenario("hourly-varying-pm", rain_series(hourly[:120], 0.04, 1.5), cleaning_threshold=0.5,
             surface_tilt=20.0, pm2_5=rng.uniform(5e-6, 2e-4, 120),
             pm10=rng.uniform(1e-6, 4e-4, 120)),
    # Vertical module: cosd(90) ≈ 6e-17, mass ~0, SR ~1.
    scenario("vertical", rain_series(hourly[:48], 0.0, 1.0), cleaning_threshold=1.0,
             surface_tilt=90.0, pm2_5=1e-4, pm10=2e-4),
    # Irregular timestamps, custom deposition velocities, 3 h window.
    scenario("irregular-custom-velocity", rain_series(irregular, 0.08, 1.0), cleaning_threshold=0.8,
             surface_tilt=45.0, pm2_5=1e-4, pm10=3e-4, depo_veloc={"2_5": 0.002, "10": 0.01},
             rain_accum_period=pd.Timedelta("3h")),
    # Rain exactly at threshold cleans (>=), including at step 0.
    scenario("threshold-edge",
             pd.Series([1.0, 0.0, 0.0, 0.999, 0.0, 1.0] + [0.0] * 18, index=hourly[:24]),
             cleaning_threshold=1.0, surface_tilt=10.0, pm2_5=5e-4, pm10=1e-3),
]

meta = {"reference": f"pvlib.soiling.hsu @ pvlib {pvlib.__version__}",
        "note": "rainfallAccumulated = rainfall.rolling(rain_accum_period, closed='right').sum(); "
                "timestepMs = interval ending at the step (step 0: first interval); "
                "first step prevAccumulatedMass = 0"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=1) + "\n")
print(f"wrote {len(cases)} cases, {sum(len(c['steps']) for c in cases)} steps → {OUT}")
