# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy==2.3.3"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for pvkit/sizer {voltage-at-temperature,nec-voltage-correction,string-size}.

The reference is the explicit rule of NFPA 70 (NEC) §690.7(A) — coefficient method and
Table 690.7(A) — evaluated in Python float64, plus the integer limits floor(Vdcmax/Voc_max),
ceil(Vmppt_low/Vmp_min), floor(Idcmax/Imp). Cases carrying `source`/`published` are cited
worked examples; this script asserts it reproduces each published value.
Run: uv run scripts/fixtures/sizer.py
"""

import json
import math
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2] / "packages/pvkit/src/models/sizer"
rng = np.random.default_rng(20261006)
META = {"reference": "NEC 2023 690.7(A) explicit formulas, Python float64"}

# Table 690.7(A), rows as printed (sources: nec-voltage-correction.md → Reference): (warmest °C, coldest °C, factor).
NEC = [(24, 20, 1.02), (19, 15, 1.04), (14, 10, 1.06), (9, 5, 1.08), (4, 0, 1.10),
       (-1, -5, 1.12), (-6, -10, 1.14), (-11, -15, 1.16), (-16, -20, 1.18), (-21, -25, 1.20),
       (-26, -30, 1.21), (-31, -35, 1.23), (-36, -40, 1.25)]


def write(method, cases):
    out = ROOT / method / f"{method}-fixtures.json"
    out.write_text(json.dumps({"meta": META, "cases": cases}, indent=2) + "\n")
    print(f"wrote {len(cases)} cases → {method}")


def vat(voltage, beta, temp_cell, temp_ref=25.0):
    return {"input": {"voltage": voltage, "beta": beta, "tempCell": temp_cell, "tempRef": temp_ref},
            "expected": voltage + beta * (temp_cell - temp_ref)}


HOLT = "Mike Holt, Illustrated Guide to the 2011 NEC Requirements for Solar PV Systems, §690.7"
PSU = "Penn State AE 868, Voltage design, https://courses.ems.psu.edu/ae868/node/943"


def published(case, source, value, digits):
    """Pin a cited worked example: the formula must reproduce its printed (rounded) value."""
    got = case["expected"]
    assert round(got, digits) == value, (source, got, value)
    return {**case, "source": source, "published": value}


write("voltage-at-temperature",
      [published(vat(22.60, -0.075, -7.0), HOLT + " (V/°C example)", 25.0, 2),
       published(vat(38.0, 60 * -0.0032, -23.0), PSU + " (Method 1)", 47.2, 1),
       vat(38.63, -0.12118231, -10.0), vat(30.72, -0.12118231, 70.0), vat(50.0, 0.0, -40.0),
       vat(45.0, -0.15, 25.0), vat(0.0, -0.1, -20.0), vat(41.2, -0.13, -40.0, 20.0)]
      + [vat(float(rng.uniform(5, 90)), float(rng.uniform(-0.35, -0.02)),
             float(rng.uniform(-45, 85)), float(rng.choice([25.0, 20.0]))) for _ in range(44)])


def nec(t):
    if t >= 25:
        return 1.0
    for warm, cold, f in NEC:
        if t >= cold:  # between rows → colder row
            return f
    return None  # out of table


temps = [25.0, 30.0, 24.5, -40.0, -40.5, -60.0, 19.5, -0.5]
for warm, cold, _ in NEC:
    temps += [float(warm), float(cold)]
temps += [float(round(rng.uniform(-45, 30), 2)) for _ in range(30)]
nec_cases = [published({"input": {"tempMin": -7.0}, "expected": nec(-7.0)}, HOLT, 1.14, 2),
             published({"input": {"tempMin": (-10 - 32) * 5 / 9}, "expected": nec((-10 - 32) * 5 / 9)},
                       PSU + " (Method 2, −10 °F)", 1.20, 2)]
write("nec-voltage-correction",
      nec_cases + [{"input": {"tempMin": t}, "expected": nec(t)} for t in temps])


def size(voc_max, vmp_min, imp, vdc_max, mppt_low, idc_max):
    return {"input": {"vocMax": voc_max, "vmpMin": vmp_min, "imp": imp, "vdcMax": vdc_max,
                      "mpptLow": mppt_low, "idcMax": idc_max},
            "expected": {"minSeries": max(1, math.ceil(mppt_low / vmp_min)),
                         "maxSeries": math.floor(vdc_max / voc_max),
                         "maxParallel": math.floor(idc_max / imp)}}


cases = [size(50.0, 25.0, 9.0, 600.0, 250.0, 18.0),  # exact quotients
         size(42.87, 26.1, 8.81, 600.0, 250.0, 18.0),
         size(65.0, 30.0, 10.0, 600.0, 580.0, 9.0),  # infeasible: min > max, no parallel
         size(40.0, 30.0, 10.0, 1000.0, 0.0, 30.0)]
cases += [size(float(rng.uniform(20, 80)), float(rng.uniform(15, 60)), float(rng.uniform(4, 18)),
               float(rng.choice([480.0, 600.0, 1000.0, 1500.0])), float(rng.uniform(50, 500)),
               float(rng.uniform(8, 60))) for _ in range(46)]
write("string-size", cases)
