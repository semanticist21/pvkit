# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for @pvkit/core tracking/singleaxis from pvlib.tracking.singleaxis.

Run: uv run scripts/fixtures/tracking-singleaxis.py
Writes packages/core/src/models/tracking/singleaxis/singleaxis-fixtures.json.
NaN outputs (sun below horizon) are written as null.
"""

import json
import math
from pathlib import Path

import numpy as np
import pvlib

OUT = Path(__file__).resolve().parents[2] / "packages/core/src/models/tracking/singleaxis/singleaxis-fixtures.json"
FIELDS = {"tracker_theta": "trackerTheta", "aoi": "aoi", "surface_tilt": "surfaceTilt",
          "surface_azimuth": "surfaceAzimuth"}


def case(zen, az, axis_tilt=0.0, axis_azimuth=0.0, max_angle=90.0, min_angle=None,
         backtrack=True, gcr=2.0 / 7.0, cross_axis_tilt=0.0):
    r = pvlib.tracking.singleaxis(
        zen, az, axis_tilt=axis_tilt, axis_azimuth=axis_azimuth,
        max_angle=max_angle if min_angle is None else (min_angle, max_angle),
        backtrack=backtrack, gcr=gcr, cross_axis_tilt=cross_axis_tilt,
    )
    inp = dict(apparentZenith=zen, solarAzimuth=az, axisTilt=axis_tilt, axisAzimuth=axis_azimuth,
               maxAngle=max_angle, backtrack=backtrack, gcr=gcr, crossAxisTilt=cross_axis_tilt)
    if min_angle is not None:
        inp["minAngle"] = min_angle
    exp = {}
    for k, v in FIELDS.items():
        x = float(np.asarray(r[k]).ravel()[0])
        exp[v] = None if math.isnan(x) else x
    return {"input": inp, "expected": exp}


cases = [
    # Solar noon on a N-S axis: flat, surface azimuth = axisAzimuth - 90 sentinel.
    case(10.0, 180.0),
    case(10.0, 180.0, axis_azimuth=180.0),
    # Sun at zenith, exactly on the horizon, just below, deep night (NaN).
    case(0.0, 0.0, axis_azimuth=180.0),
    case(90.0, 90.0, axis_azimuth=180.0),
    case(90.0, 270.0, axis_azimuth=180.0, backtrack=False),
    case(90.001, 90.0, axis_azimuth=180.0),
    case(120.0, 0.0, axis_azimuth=180.0),
    # maxAngle 0 → always flat; asymmetric limits; gcr = 1 (rows touching).
    case(60.0, 100.0, axis_azimuth=180.0, max_angle=0.0),
    case(60.0, 100.0, axis_azimuth=180.0, max_angle=60.0, min_angle=-30.0, backtrack=False),
    case(70.0, 260.0, axis_azimuth=180.0, max_angle=20.0, min_angle=-50.0),
    case(80.0, 95.0, axis_azimuth=180.0, gcr=1.0),
    # Sun in the plane containing the axis (omega = 0) and backtracking on a slope.
    case(40.0, 180.0, axis_azimuth=180.0, axis_tilt=10.0),
    case(85.0, 100.0, axis_azimuth=180.0, axis_tilt=5.0, gcr=0.5, cross_axis_tilt=-10.0),
    case(85.0, 260.0, axis_azimuth=180.0, axis_tilt=5.0, gcr=0.5, cross_axis_tilt=10.0),
]

rng = np.random.default_rng(20261005)


def rand_params():
    axis_azimuth = float(rng.choice([0.0, 180.0, float(rng.uniform(0, 360))]))
    axis_tilt = 0.0 if rng.random() < 0.4 else float(rng.uniform(0, 30))
    max_angle = float(rng.uniform(30, 90))
    min_angle = float(-rng.uniform(30, 90)) if rng.random() < 0.2 else None
    cross = 0.0 if rng.random() < 0.4 else float(rng.uniform(-20, 20))
    return dict(axis_tilt=axis_tilt, axis_azimuth=axis_azimuth, max_angle=max_angle,
                min_angle=min_angle, backtrack=bool(rng.random() < 0.7),
                gcr=float(rng.uniform(0.1, 1.0)), cross_axis_tilt=cross)


# Broad sweep, including below-horizon suns.
for _ in range(100):
    cases.append(case(float(rng.uniform(0, 100)), float(rng.uniform(0, 360)), **rand_params()))
# Near horizon: backtracking dominates at zenith 85–90°.
for _ in range(40):
    cases.append(case(float(rng.uniform(85, 90)), float(rng.uniform(0, 360)), **rand_params()))

meta = {"reference": f"pvlib.tracking.singleaxis @ pvlib {pvlib.__version__}",
        "nan": "null in expected means NaN (sun below horizon)"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
