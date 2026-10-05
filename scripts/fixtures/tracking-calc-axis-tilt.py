# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for @pvkit/core tracking/calc-axis-tilt and tracking/calc-cross-axis-tilt
from pvlib.tracking.calc_axis_tilt / calc_cross_axis_tilt (same slope geometry).

Run: uv run scripts/fixtures/tracking-calc-axis-tilt.py
Writes calc-axis-tilt-fixtures.json and calc-cross-axis-tilt-fixtures.json into
packages/core/src/models/tracking/<method>/.
"""

import json
from pathlib import Path

import numpy as np
import pvlib

DIR = Path(__file__).resolve().parents[2] / "packages/core/src/models/tracking"

# Edge geometry: flat ground, axis along / across / oblique to the slope, steep slope.
edges = [(180.0, 0.0, 180.0), (180.0, 10.0, 180.0), (180.0, 10.0, 0.0), (90.0, 10.0, 180.0),
         (270.0, 10.0, 180.0), (135.0, 20.0, 180.0), (200.0, 45.0, 170.0), (0.0, 80.0, 30.0),
         (180.0, 89.0, 180.0), (350.0, 15.0, 10.0)]
rng = np.random.default_rng(20261005)
geoms = edges + [(float(rng.uniform(0, 360)), float(rng.uniform(0, 45)), float(rng.uniform(0, 360)))
                 for _ in range(90)]

axis_cases, cross_cases = [], []
for slope_azimuth, slope_tilt, axis_azimuth in geoms:
    axis_tilt = float(pvlib.tracking.calc_axis_tilt(slope_azimuth, slope_tilt, axis_azimuth))
    axis_cases.append({
        "input": dict(slopeAzimuth=slope_azimuth, slopeTilt=slope_tilt, axisAzimuth=axis_azimuth),
        "expected": {"axisTilt": axis_tilt},
    })
    cross = float(pvlib.tracking.calc_cross_axis_tilt(slope_azimuth, slope_tilt, axis_azimuth,
                                                      axis_tilt))
    cross_cases.append({
        "input": dict(slopeAzimuth=slope_azimuth, slopeTilt=slope_tilt, axisAzimuth=axis_azimuth,
                      axisTilt=axis_tilt),
        "expected": {"crossAxisTilt": cross},
    })

for name, fn, cases in [("calc-axis-tilt", "calc_axis_tilt", axis_cases),
                        ("calc-cross-axis-tilt", "calc_cross_axis_tilt", cross_cases)]:
    meta = {"reference": f"pvlib.tracking.{fn} @ pvlib {pvlib.__version__}"}
    out = DIR / name / f"{name}-fixtures.json"
    out.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
    print(f"wrote {len(cases)} cases → {out}")
