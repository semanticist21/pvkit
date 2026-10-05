# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for @pvkit/core iam/marion from pvlib.iam.marion_integrate / marion_diffuse.

Run: uv run scripts/fixtures/iam-marion.py
Writes packages/core/src/models/iam/marion/marion-fixtures.json.
Each case names the IAM model + its pvlib kwargs; the test rebuilds the IAM function from
the sibling pvkit methods. `num` absent → pvlib default (and marion_diffuse is cross-checked).
"""

import functools
import json
from pathlib import Path

import numpy as np
import pvlib

OUT = Path(__file__).resolve().parents[2] / "packages/core/src/models/iam/marion/marion-fixtures.json"
MODELS = {"physical": pvlib.iam.physical, "ashrae": pvlib.iam.ashrae,
          "martinRuiz": pvlib.iam.martin_ruiz, "sapm": pvlib.iam.sapm}
# pvkit field name → pvlib kwarg.
PY_KW = {"k": "K", "l": "L", "nAr": "n_ar", "aR": "a_r"}
SAPM = {"b0": 0.9986, "b1": -0.002616, "b2": 0.0003324, "b3": -1.48e-05, "b4": 2.556e-07,
        "b5": -1.524e-09}


def iam_fn(model, params):
    if model == "sapm":
        return functools.partial(pvlib.iam.sapm, module={k.upper(): v for k, v in params.items()})
    return functools.partial(MODELS[model], **{PY_KW.get(k, k): v for k, v in params.items()})


def case(model, params, tilt, num=None):
    f = iam_fn(model, params)
    exp = {r: float(pvlib.iam.marion_integrate(f, tilt, r, num=num))
           for r in ["sky", "horizon", "ground"]}
    if num is None:
        d = pvlib.iam.marion_diffuse(model if model != "martinRuiz" else "martin_ruiz", tilt,
                                     **({"module": f.keywords["module"]} if model == "sapm"
                                        else f.keywords))
        assert all(float(d[r]) == exp[r] for r in exp)
    inp = dict(model=model, params=params, surfaceTilt=tilt)
    if num is not None:
        inp["num"] = num
    return {"input": inp, "expected": exp}


DEFAULTS = [("physical", {"n": 1.526, "k": 4.0, "l": 0.002}), ("ashrae", {"b": 0.05}),
            ("martinRuiz", {"aR": 0.16}), ("sapm", SAPM)]
cases = []
# Tilt sweep incl. flat, vertical, upside-down, beyond 180.
for model, params in DEFAULTS:
    cases += [case(model, params, t) for t in [0.0, 20.0, 45.0, 90.0, 135.0, 180.0]]
# pvlib docstring examples: physical tilt 20 (above), ashrae b=0.04, physical n=1.3.
cases += [case("ashrae", {"b": 0.04}, t) for t in [20.0, 30.0]]
cases += [case("physical", {"n": 1.3, "k": 4.0, "l": 0.002}, t) for t in [20.0, 30.0]]
cases.append(case("physical", {"n": 1.526, "k": 4.0, "l": 0.002, "nAr": 1.29}, 30.0))
# Custom grid resolution.
cases += [case("physical", {"n": 1.526, "k": 4.0, "l": 0.002}, 30.0, n) for n in [1, 7, 90, 360]]
cases.append(case("ashrae", {"b": 0.05}, 89.5, 2000))
rng = np.random.default_rng(20261005)
for _ in range(10):
    model, params = DEFAULTS[int(rng.integers(len(DEFAULTS)))]
    cases.append(case(model, params, float(rng.uniform(0, 180))))

meta = {"reference": f"pvlib.iam.marion_integrate / marion_diffuse @ pvlib {pvlib.__version__}"}
OUT.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT}")
