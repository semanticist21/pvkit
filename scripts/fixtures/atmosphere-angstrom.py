# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for @pvkit/core atmosphere/angstrom from pvlib.atmosphere.angstrom_aod_at_lambda
and angstrom_alpha.

Run: uv run scripts/fixtures/atmosphere-angstrom.py
Writes packages/core/src/models/atmosphere/angstrom/angstrom-fixtures.json with one case list
per function.
"""

import json
from pathlib import Path

import numpy as np
import pvlib

OUT = (Path(__file__).resolve().parents[2]
       / "packages/core/src/models/atmosphere/angstrom/angstrom-fixtures.json")
atm = pvlib.atmosphere


def at_lambda(aod0, lambda0, alpha, lambda1):
    return {"input": {"aod0": aod0, "lambda0": lambda0, "alpha": alpha, "lambda1": lambda1},
            "expected": float(atm.angstrom_aod_at_lambda(aod0, lambda0, alpha=alpha,
                                                         lambda1=lambda1))}


def alpha(aod1, lambda1, aod2, lambda2):
    return {"input": {"aod1": aod1, "lambda1": lambda1, "aod2": aod2, "lambda2": lambda2},
            "expected": float(atm.angstrom_alpha(aod1, lambda1, aod2, lambda2))}


rng = np.random.default_rng(20261005)
aod_at_lambda = [at_lambda(0.1, 500.0, 1.14, 700.0), at_lambda(0.0, 500.0, 1.14, 700.0),
                 at_lambda(0.5, 380.0, 0.0, 1020.0), at_lambda(2.0, 340.0, 2.5, 1640.0),
                 at_lambda(0.084, 1240.0, -0.5, 400.0), at_lambda(0.3, 550.0, 1.3, 550.0)]
aod_at_lambda += [at_lambda(float(rng.uniform(0.01, 1.5)), float(rng.uniform(340, 1640)),
                            float(rng.uniform(-0.5, 2.5)), float(rng.uniform(340, 1640)))
                  for _ in range(44)]
alphas = [alpha(0.2, 380.0, 0.1, 500.0), alpha(0.1, 500.0, 0.1, 870.0),
          alpha(0.05, 440.0, 0.3, 1020.0), alpha(1.5, 340.0, 0.01, 1640.0)]
alphas += [alpha(float(rng.uniform(0.01, 1.5)), float(rng.uniform(340, 600)),
                 float(rng.uniform(0.01, 1.5)), float(rng.uniform(700, 1640)))
           for _ in range(46)]

meta = {"reference": "pvlib.atmosphere.angstrom_aod_at_lambda / angstrom_alpha "
                     f"@ pvlib {pvlib.__version__}"}
OUT.write_text(json.dumps({"meta": meta, "angstromAodAtLambda": aod_at_lambda,
                           "angstromAlpha": alphas}, indent=2) + "\n")
print(f"wrote {len(aod_at_lambda)} + {len(alphas)} cases → {OUT}")
