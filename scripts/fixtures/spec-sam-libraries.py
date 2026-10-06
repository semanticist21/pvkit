# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Data + fixtures for @pvkit/spec from the NREL SAM component libraries.

Run: uv run scripts/fixtures/spec-sam-libraries.py
Downloads the SAM library CSVs at a pinned release tag and writes, per library,
packages/spec/src/<lib>/<lib>-data.json (every row, parsed with the csv module) and
<lib>-fixtures.json (sampled rows as parsed independently by pvlib.pvsystem.retrieve_sam:
first, last, 40 random, the first row of each blank-cell pattern, and the row where pvlib's
parse drifts furthest from the CSV text).
"""

import csv
import io
import json
import math
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path

import numpy as np
import pvlib

SAM_TAG = "2026.7.3.r0.ssc.308"
BASE = f"https://raw.githubusercontent.com/NREL/SAM/{SAM_TAG}/deploy/libraries/"
SRC = Path(__file__).resolve().parents[2] / "packages/spec/src"

num = float
text = str


def opt(v):  # blank or "nan" cell → null (field omitted after decoding)
    return None if v.strip().lower() in ("", "nan") else float(v)


def yes(v):
    return v.strip() == "Y"


def bit(v):
    return v.strip() == "1"


def pct(v):  # %/K → 1/K
    return float(v) / 100


# (field, SAM column, converter); fields are pvkit names, units fixed by the .ts JSDoc.
LIBS = {
    "cec-modules": ("CEC Modules.csv", [
        ("manufacturer", "Manufacturer", text), ("technology", "Technology", text),
        ("bifacial", "Bifacial", bit), ("bipv", "BIPV", yes), ("stc", "STC", num),
        ("ptc", "PTC", num), ("area", "A_c", num), ("length", "Length", opt),
        ("width", "Width", opt), ("cellsInSeries", "N_s", opt), ("isc", "I_sc_ref", num),
        ("voc", "V_oc_ref", num), ("imp", "I_mp_ref", num), ("vmp", "V_mp_ref", num),
        ("alphaSc", "alpha_sc", num), ("betaOc", "beta_oc", num), ("gammaPmp", "gamma_pmp", pct),
        ("noct", "T_NOCT", num), ("aRef", "a_ref", num), ("iLRef", "I_L_ref", num),
        ("iORef", "I_o_ref", num), ("rS", "R_s", num), ("rShRef", "R_sh_ref", num),
        ("adjust", "Adjust", num),
    ]),
    "cec-inverters": ("CEC Inverters.csv", [
        ("vac", "Vac", num), ("paco", "Paco", num), ("pdco", "Pdco", num), ("vdco", "Vdco", num),
        ("pso", "Pso", num), ("c0", "C0", num), ("c1", "C1", num), ("c2", "C2", num),
        ("c3", "C3", num), ("pnt", "Pnt", opt), ("vdcMax", "Vdcmax", num),
        ("idcMax", "Idcmax", num), ("mpptLow", "Mppt_low", num), ("mpptHigh", "Mppt_high", num),
        ("hybrid", "CEC_hybrid", yes),
    ]),
    "sandia-modules": ("Sandia Modules.csv", [
        ("vintage", "Vintage", text), ("material", "Material", text), ("area", "Area", num),
        ("cellsInSeries", "Cells in Series", num), ("parallelStrings", "Parallel Strings", num),
        ("isco", "Isco", num), ("voco", "Voco", num), ("impo", "Impo", num),
        ("vmpo", "Vmpo", num), ("aisc", "Aisc", num), ("aimp", "Aimp", num),
        ("bvoco", "Bvoco", num), ("mbvoc", "Mbvoc", num), ("bvmpo", "Bvmpo", num),
        ("mbvmp", "Mbvmp", num), ("n", "N", num),
        *[(f"c{i}", f"C{i}", num) for i in range(4)],
        *[(f"c{i}", f"C{i}", opt) for i in range(4, 8)],
        ("ixo", "IXO", opt), ("ixxo", "IXXO", opt),
        *[(f"a{i}", f"A{i}", num) for i in range(5)],
        *[(f"b{i}", f"B{i}", num) for i in range(6)],
        ("fd", "FD", num), ("a", "a", num), ("b", "b", num), ("tempDelta", "dT", num),
    ]),
}


def plain(v):  # pvlib/pandas cell → JSON value
    if isinstance(v, str):
        return v
    v = float(v)
    return None if math.isnan(v) else v


for lib, (file, cols) in LIBS.items():
    raw = urllib.request.urlopen(BASE + urllib.parse.quote(file)).read().decode("utf-8")
    rows = list(csv.reader(io.StringIO(raw)))
    header, body = rows[0], rows[3:]  # rows 1-2: units, SAM variable names
    idx = [header.index(c) for _, c, _ in cols]
    fields = ["name", *(f for f, _, _ in cols)]
    data = [[r[0], *(conv(r[i]) for (_, _, conv), i in zip(cols, idx))] for r in body]
    meta = {"source": f"NREL SAM {SAM_TAG} deploy/libraries/{file}", "rows": len(data)}
    compact = [[int(v) if isinstance(v, float) and v.is_integer() else v for v in r] for r in data]
    lines = ",\n".join(json.dumps(r, ensure_ascii=False, separators=(",", ":"), allow_nan=False) for r in compact)
    (SRC / lib / f"{lib}-data.json").write_text(
        f'{{"meta":{json.dumps(meta)},\n"fields":{json.dumps(fields)},\n"rows":[\n{lines}\n]}}\n')

    with tempfile.NamedTemporaryFile("w", suffix=".csv") as f:
        f.write(raw)
        f.flush()
        frame = pvlib.pvsystem.retrieve_sam(path=f.name)
    def pv(i):  # row i as parsed by pvlib
        return {c: plain(frame.iloc[:, i][c.replace(" ", "_")]) for _, c, _ in cols}

    def drift(i):  # worst relative gap between pvlib's parse and ours (pandas' C parser)
        return max((abs(v - (pct(w) if conv is pct else w)) / abs(v)
                    for v, w, (_, _, conv) in zip(data[i][1:], pv(i).values(), cols)
                    if type(v) is float and v and w is not None), default=0.0)

    rng = np.random.default_rng(20261006)
    nulls = {}  # first row of each distinct blank-cell pattern
    for i, r in enumerate(data):
        nulls.setdefault(tuple(v is None for v in r), i)
    picks = {0, len(data) - 1, *rng.choice(len(data), 40, replace=False).tolist(),
             *(i for k, i in nulls.items() if any(k))}
    gaps = [drift(i) for i in range(len(data))]
    if max(gaps):
        picks.add(gaps.index(max(gaps)))
    cases = [{"index": i, "name": data[i][0], "pvlib": pv(i)} for i in sorted(picks)]
    fmeta = {"reference": f"pvlib.pvsystem.retrieve_sam @ pvlib {pvlib.__version__}", **meta}
    (SRC / lib / f"{lib}-fixtures.json").write_text(
        json.dumps({"meta": fmeta, "cases": cases}, indent=2, ensure_ascii=False, allow_nan=False) + "\n")
    print(f"wrote {len(data)} rows, {len(cases)} cases → {lib}")
