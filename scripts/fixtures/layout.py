# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""@pvkit/layout fixtures from pvlib.shading (and numpy.interp for the horizon profile).

Run: uv run scripts/fixtures/layout.py
"""

import itertools
import json
import math
from pathlib import Path

import numpy as np
from pvlib import shading

SRC = Path(__file__).resolve().parents[2] / "packages/layout/src"


def num(v):
    v = float(v)
    return None if math.isnan(v) else v


def write(name, cases):
    (SRC / name).mkdir(parents=True, exist_ok=True)
    (SRC / name / f"{name}-fixtures.json").write_text(json.dumps(cases, indent=2) + "\n")


TILTS = [0, 0.5, 10, 25, 30, 45, 60, 89.5, 90]
GCRS = [0.01, 0.2, 0.4, 0.5, 0.7, 0.99, 1]
SLANT = [0, 0.25, 0.5, 1]

write("ground-angle", [
    {"surfaceTilt": t, "gcr": g, "slantHeight": h,
     "expected": num(shading.ground_angle(t, g, h))}
    for t, g, h in itertools.product(TILTS, GCRS, SLANT)
])
write("masking-angle", [
    {"surfaceTilt": t, "gcr": g, "slantHeight": h,
     "expected": num(shading.masking_angle(t, g, h))}
    for t, g, h in itertools.product(TILTS, GCRS, SLANT)
])
write("masking-angle-passias", [
    {"surfaceTilt": t, "gcr": g,
     "expected": num(shading.masking_angle_passias(np.array([t]), g)[0])}
    for t, g in itertools.product(TILTS, GCRS)
])
write("sky-diffuse-passias", [
    {"maskingAngle": a, "expected": num(shading.sky_diffuse_passias(a))}
    for a in [0, 0.1, 1, 5, 10, 20, 30, 45, 60, 90]
])

SUN = [(z, a) for z in [0, 10, 45, 60, 80, 89, 90, 95] for a in [0, 90, 135, 180, 225, 270, 359]]
write("projected-solar-zenith-angle", [
    {"solarZenith": z, "solarAzimuth": a, "axisTilt": at, "axisAzimuth": aa,
     "expected": num(shading.projected_solar_zenith_angle(z, a, at, aa))}
    for (z, a), at, aa in itertools.product(SUN, [0, 5, 20], [0, 90, 180, 200])
])

cases = []
for (z, a), (aa, rot), pitch, at, off, slope, shading_rot in itertools.product(
    [(30, 180), (60, 150), (70, 200), (80, 120), (85, 240), (45, 90), (89, 270)],
    [(90, 30), (90, 10), (180, 40), (180, -40), (180, 0), (200, 25)],
    [2, 4, 6],
    [0, 5],
    [0, 0.1],
    [0, 3],
    [None, 20],
):
    kwargs = dict(collector_width=2, pitch=pitch, axis_tilt=at, surface_to_axis_offset=off,
                  cross_axis_slope=slope, shading_row_rotation=shading_rot)
    cases.append({
        "solarZenith": z, "solarAzimuth": a, "axisAzimuth": aa, "shadedRowRotation": rot,
        "collectorWidth": 2, "pitch": pitch, "axisTilt": at, "surfaceToAxisOffset": off,
        "crossAxisTilt": slope, "shadingRowRotation": shading_rot,
        "expected": num(shading.shaded_fraction1d(z, a, aa, rot, **kwargs)),
    })
write("shaded-fraction1d", cases)

write("direct-martinez", [
    {"poaGlobal": g, "poaDirect": d, "shadedFraction": f, "shadedBlocks": sb, "totalBlocks": tb,
     "expected": num(shading.direct_martinez(g, d, f, sb, tb))}
    for (g, d), f, (sb, tb) in itertools.product(
        [(1000, 800), (600, 300), (200, 0), (850.5, 700.25)],
        [0, 0.1, 0.5, 1],
        [(0, 1), (0.3, 3), (1, 3), (2.5, 3), (3, 3), (5, 20)],
    )
])

PROFILE = [(0, 5), (45, 12.5), (90, 3), (180, 0), (200, 20), (270, 8), (315, 1)]
write("horizon", {
    "profile": [{"azimuth": a, "elevation": e} for a, e in PROFILE],
    "cases": [
        {"azimuth": az, "expected": num(np.interp(az, [p[0] for p in PROFILE],
                                                  [p[1] for p in PROFILE], period=360))}
        for az in [0, 10, 44.9, 45, 89, 135, 180, 190, 199.99, 250, 300, 315, 330, 359.9, 360, 400, -30]
    ],
})
