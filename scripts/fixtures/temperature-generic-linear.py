# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# ///
"""Fixtures for @pvkit/core temperature/generic-linear and temperature/generic-linear-model
from pvlib.temperature.generic_linear and pvlib.temperature.GenericLinearModel.

Run: uv run scripts/fixtures/temperature-generic-linear.py
Writes generic-linear-fixtures.json and generic-linear-model-fixtures.json.
"""

import json
from pathlib import Path

import numpy as np
import pvlib
from pvlib.temperature import GenericLinearModel, generic_linear

ROOT = Path(__file__).resolve().parents[2] / "packages/core/src/models/temperature"
rng = np.random.default_rng(20261005)
meta = {"reference": f"pvlib.temperature.generic_linear / GenericLinearModel @ pvlib {pvlib.__version__}"}


def write(method, cases):
    out = ROOT / method / f"{method}-fixtures.json"
    out.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
    print(f"wrote {len(cases)} cases → {out}")


# ---- generic-linear ---------------------------------------------------------------------
def gl(poa, temp_air, wind, u_const, du_wind, eta, alpha):
    inp = dict(poaGlobal=poa, tempAir=temp_air, windSpeed=wind, uConst=u_const, duWind=du_wind,
               moduleEfficiency=eta, absorptance=alpha)
    t = float(generic_linear(poa, temp_air, wind, u_const, du_wind, eta, alpha))
    return {"input": inp, "expected": {"moduleTemperature": t}}


cases = [gl(poa, ta, ws, 11.04, 5.52, 0.19, 0.88) for poa, ta, ws in [
    (1000.0, 25.0, 1.0), (1000.0, 10.0, 0.0), (0.0, 15.0, 3.0), (-5.0, -10.0, 2.0),
    (1400.0, 50.0, 0.0), (800.0, -40.0, 30.0)]]
for _ in range(80):
    cases.append(gl(
        float(rng.uniform(0, 1400)), float(rng.uniform(-30, 50)), float(rng.uniform(0, 20)),
        float(rng.uniform(5, 30)), float(rng.uniform(0, 8)), float(rng.uniform(0.05, 0.25)),
        float(rng.uniform(0.8, 0.98)),
    ))
write("generic-linear", cases)


# ---- generic-linear-model ---------------------------------------------------------------
def glm_out(m):
    return dict(uConst=float(m.u_const), duWind=float(m.du_wind),
                moduleEfficiency=float(m.eta), absorptance=float(m.alpha))


def conv(eta, alpha, u_const, du_wind, use, low=1.4, high=5.4):
    """One 'from' case for the source model `use`, plus the 4 'to' cases from GLM params."""
    m = GenericLinearModel(module_efficiency=eta, absorptance=alpha)
    glm = dict(uConst=u_const, duWind=du_wind, moduleEfficiency=eta, absorptance=alpha)
    m.u_const, m.du_wind = u_const, du_wind
    f = m.to_faiman()
    p = m.to_pvsyst()
    n = m.to_noct_sam()
    s = m.to_sapm(wind_fit_low=low, wind_fit_high=high)
    sap = dict(a=float(s["a"]), b=float(s["b"]))
    out = [
        {"fn": "genericLinearToFaiman", "input": glm,
         "expected": dict(u0=float(f["u0"]), u1=float(f["u1"]))},
        {"fn": "genericLinearToPvsyst", "input": glm,
         "expected": dict(uC=float(p["u_c"]), uV=float(p["u_v"]),
                          moduleEfficiency=float(p["module_efficiency"]),
                          alphaAbsorption=float(p["alpha_absorption"]))},
        {"fn": "genericLinearToNoctSam", "input": glm,
         "expected": dict(noct=float(n["noct"]), moduleEfficiency=float(n["module_efficiency"]),
                          transmittanceAbsorptance=float(n["transmittance_absorptance"]))},
        {"fn": "genericLinearToSapm", "input": glm | dict(windFitLow=low, windFitHigh=high),
         "expected": sap},
    ]
    # 'from' cases: feed each target model's parameters back through a fresh model.
    def fresh():
        return GenericLinearModel(module_efficiency=eta, absorptance=alpha)
    if use == "faiman":
        inp = dict(u0=float(f["u0"]) * 1.1, u1=float(f["u1"]) * 0.9, moduleEfficiency=eta,
                   absorptance=alpha)
        r = fresh().use_faiman(inp["u0"], inp["u1"])
        out.append({"fn": "genericLinearFromFaiman", "input": inp, "expected": glm_out(r)})
    elif use == "pvsyst":
        inp = dict(uC=float(p["u_c"]) * 1.1, uV=float(p["u_v"]) * 0.9, moduleEfficiency=eta,
                   alphaAbsorption=alpha)
        r = fresh().use_pvsyst(inp["uC"], inp["uV"], module_efficiency=eta, alpha_absorption=alpha)
        out.append({"fn": "genericLinearFromPvsyst", "input": inp, "expected": glm_out(r)})
    elif use == "noct_sam":
        inp = dict(noct=float(n["noct"]) + 1.0, moduleEfficiency=eta,
                   transmittanceAbsorptance=alpha)
        r = fresh().use_noct_sam(inp["noct"], module_efficiency=eta,
                                 transmittance_absorptance=alpha)
        out.append({"fn": "genericLinearFromNoctSam", "input": inp, "expected": glm_out(r)})
    else:
        inp = dict(a=sap["a"] + 0.05, b=sap["b"] * 0.95, moduleEfficiency=eta, absorptance=alpha,
                   windFitLow=low, windFitHigh=high)
        r = fresh().use_sapm(inp["a"], inp["b"], wind_fit_low=low, wind_fit_high=high)
        out.append({"fn": "genericLinearFromSapm", "input": inp, "expected": glm_out(r)})
    return out


cases = []
# pvlib docstring example (Driesse et al. 2022 workflow): eta 0.19, alpha 0.88, faiman(16, 8).
cases += conv(0.19, 0.88, 11.04, 5.52, "faiman")
for use in ["pvsyst", "noct_sam", "sapm"]:
    cases += conv(0.19, 0.88, 11.04, 5.52, use)
# SAPM presets from TEMPERATURE_MODEL_PARAMETERS through use_sapm with default fit winds.
for p in pvlib.temperature.TEMPERATURE_MODEL_PARAMETERS["sapm"].values():
    r = GenericLinearModel(module_efficiency=0.2, absorptance=0.9).use_sapm(p["a"], p["b"])
    cases.append({"fn": "genericLinearFromSapm",
                  "input": dict(a=float(p["a"]), b=float(p["b"]), moduleEfficiency=0.2,
                                absorptance=0.9, windFitLow=1.4, windFitHigh=5.4),
                  "expected": glm_out(r)})
uses = ["faiman", "pvsyst", "noct_sam", "sapm"]
for i in range(32):
    low = 1.4 if i % 2 else float(rng.uniform(0.5, 2.0))
    high = 5.4 if i % 2 else float(rng.uniform(4.0, 8.0))
    cases += conv(float(rng.uniform(0.05, 0.25)), float(rng.uniform(0.8, 0.98)),
                  float(rng.uniform(5, 30)), float(rng.uniform(0.5, 8)), uses[i % 4], low, high)
write("generic-linear-model", cases)
