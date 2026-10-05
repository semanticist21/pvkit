# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# ///
"""Fixtures for @pvkit/core losses/soiling-kimber from pvlib.soiling.kimber.

Run: uv run scripts/fixtures/losses-soiling-kimber.py
Writes packages/core/src/models/losses/soiling-kimber/soiling-kimber-fixtures.json.

Each case is a whole series: pvlib runs once on it, and every step records the per-step
TS input (trailing-window rainfall, timestep, manual-wash flag) plus pvlib's output. The
test chains the step function over the steps, feeding back its own returned state.
"""

import json
from pathlib import Path

import numpy as np
import pandas as pd
import pvlib

OUT = (Path(__file__).resolve().parents[2]
       / "packages/core/src/models/losses/soiling-kimber/soiling-kimber-fixtures.json")


def scenario(name, rain, *, cleaning_threshold=6.0, soiling_loss_rate=0.0015, grace_period=14,
             max_soiling=0.3, initial_soiling=0.0, rain_accum_period=24, manual_wash_dates=None):
    r = pvlib.soiling.kimber(
        rain, cleaning_threshold=cleaning_threshold, soiling_loss_rate=soiling_loss_rate,
        grace_period=grace_period, max_soiling=max_soiling, manual_wash_dates=manual_wash_dates,
        initial_soiling=initial_soiling, rain_accum_period=rain_accum_period,
    )
    # Same trailing-window sum pvlib computes internally; the caller owns this in pvkit.
    accum = rain.rolling(pd.Timedelta(hours=rain_accum_period), closed="right").sum()
    step_ms = int((rain.index[1] - rain.index[0]) / pd.Timedelta(milliseconds=1))
    washes = set(pd.DatetimeIndex(manual_wash_dates or [], tz=rain.index.tz))
    steps = []
    for i, t in enumerate(rain.index):
        inp = {"rainfallAccumulated": float(accum.iloc[i]), "timestepMs": 0 if i == 0 else step_ms}
        if t in washes:
            inp["manualWash"] = True
        steps.append({"input": inp, "expected": {"soilingLoss": float(r.iloc[i])}})
    params = {"cleaningThreshold": cleaning_threshold, "soilingLossRate": soiling_loss_rate,
              "gracePeriod": grace_period, "maxSoiling": max_soiling}
    return {"name": name, "params": params, "initialSoiling": initial_soiling,
            "rainAccumPeriodHours": rain_accum_period, "steps": steps}


rng = np.random.default_rng(20261005)


def rain_series(start, periods, freq, p_rain, scale):
    idx = pd.date_range(start, periods=periods, freq=freq, tz="UTC")
    wet = rng.random(periods) < p_rain
    return pd.Series(np.where(wet, rng.exponential(scale, periods), 0.0), index=idx)


cases = [
    # Daily, pvlib defaults, mixed light/heavy rain over a season.
    scenario("daily-defaults", rain_series("2024-01-01", 150, "1D", 0.12, 6.0)),
    # Hourly: rolling 24 h window and a short grace period interact across steps.
    scenario("hourly-grace2", rain_series("2024-03-01", 480, "1h", 0.02, 3.0),
             grace_period=2, soiling_loss_rate=0.002),
    # Hits max_soiling and stays clipped (unclipped state keeps growing underneath).
    scenario("daily-clipped", rain_series("2024-06-01", 120, "1D", 0.03, 10.0),
             soiling_loss_rate=0.003, max_soiling=0.05, grace_period=5),
    # Dry, initial soiling, manual washes (no grace after a wash).
    scenario("daily-manual-wash", pd.Series(0.0, index=pd.date_range("2024-07-01", periods=60,
                                                                    freq="1D", tz="UTC")),
             initial_soiling=0.1,
             manual_wash_dates=[pd.Timestamp("2024-07-15"), pd.Timestamp("2024-08-10")]),
    # Rain event at the very first sample: grace active from step 0, wipes initial soiling.
    scenario("hourly-rain-at-start",
             pd.Series([12.0] + [0.0] * 95,
                       index=pd.date_range("2024-09-01", periods=96, freq="1h", tz="UTC")),
             initial_soiling=0.2, grace_period=1),
    # Initial soiling above max; rainfall exactly at threshold does NOT clean (strict >).
    scenario("daily-initial-over-max-threshold-edge",
             pd.Series([0.0, 6.0, 0.0, 6.0000001] + [0.0] * 26,
                       index=pd.date_range("2024-10-01", periods=30, freq="1D", tz="UTC")),
             initial_soiling=0.4, grace_period=3),
    # 15-minute data, 12 h accumulation window, low threshold.
    scenario("15min-accum12h", rain_series("2024-11-01", 288, "15min", 0.05, 0.8),
             cleaning_threshold=2.0, rain_accum_period=12, grace_period=1, soiling_loss_rate=0.01),
]

meta = {"reference": f"pvlib.soiling.kimber @ pvlib {pvlib.__version__}",
        "note": "rainfallAccumulated = rainfall.rolling(rain_accum_period, closed='right').sum(); "
                "first step uses timestepMs=0 and prevAccumulatedSoiling=initialSoiling"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=1) + "\n")
print(f"wrote {len(cases)} cases, {sum(len(c['steps']) for c in cases)} steps → {OUT}")
