# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for @pvkit/core irradiance/aoi from pvlib.irradiance.aoi / aoi_projection.

Run: uv run scripts/fixtures/irradiance-aoi.py
Writes packages/core/src/models/irradiance/aoi/aoi-fixtures.json.
"""

import json
from pathlib import Path

import numpy as np
import pvlib

OUT = Path(__file__).resolve().parents[2] / "packages/core/src/models/irradiance/aoi/aoi-fixtures.json"


def case(tilt, surf_az, zen, sun_az):
    p = pvlib.irradiance.aoi_projection(tilt, surf_az, zen, sun_az)
    a = pvlib.irradiance.aoi(tilt, surf_az, zen, sun_az)
    return {"input": dict(surfaceTilt=tilt, surfaceAzimuth=surf_az, solarZenith=zen, solarAzimuth=sun_az),
            "expected": {"aoiProjection": float(p), "aoi": float(a)}}


cases = [
    case(0.0, 180.0, 0.0, 180.0),      # flat, sun overhead → aoi 0
    case(30.0, 180.0, 30.0, 180.0),    # sun normal to panel (projection clips to 1)
    case(90.0, 180.0, 90.0, 0.0),      # sun exactly behind vertical panel → aoi 180
    case(90.0, 90.0, 89.5, 90.0),      # vertical east, sun on horizon
    case(180.0, 0.0, 10.0, 200.0),     # face-down panel
    case(45.0, 180.0, 95.0, 180.0),    # sun below horizon
    case(20.0, 359.9, 60.0, 0.1),      # azimuth wrap
    case(35.0, 180.0, 0.0, 0.0),       # azimuth irrelevant at zenith 0
]
rng = np.random.default_rng(20261005)
for _ in range(100):
    cases.append(case(float(rng.uniform(0, 180)), float(rng.uniform(0, 360)),
                      float(rng.uniform(0, 180)), float(rng.uniform(0, 360))))
for _ in range(30):  # near-horizon sun
    cases.append(case(float(rng.uniform(0, 90)), float(rng.uniform(0, 360)),
                      float(rng.uniform(85, 92)), float(rng.uniform(0, 360))))

meta = {"reference": f"pvlib.irradiance.aoi / aoi_projection @ pvlib {pvlib.__version__}"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=1) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
