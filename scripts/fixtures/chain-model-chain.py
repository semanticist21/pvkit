# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""pvkit/chain modelChain fixtures from pvlib's own ModelChain with PVWatts DC/AC/losses.

ModelChain(aoi_model="physical", spectral_model="no_loss", dc/ac/losses "pvwatts",
temperature_model="sapm", airmass "kastenyoung1989", solar position "nrel_numpy").
ΔT is pinned to 67 s (pvlib otherwise estimates it). The Seoul case omits temp_air and
wind_speed to pin ModelChain's defaults (refraction at 12 °C, cell temperature at 20 °C).
Clear-sky cases feed Location.get_clearsky (Ineichen) with the same solar position
ModelChain computes.
Run: uv run scripts/fixtures/chain-model-chain.py
"""

import json
import math
from pathlib import Path

import numpy as np
import pandas as pd
import pvlib
from pvlib.location import Location
from pvlib.modelchain import ModelChain
from pvlib.pvsystem import PVSystem

OUT = (Path(__file__).resolve().parents[2]
       / "packages/pvkit/src/models/chain/model-chain/model-chain-fixtures.json")

_get_solarposition = Location.get_solarposition
Location.get_solarposition = lambda self, times, **kw: _get_solarposition(
    self, times, delta_t=67.0, **kw)

LOSS_KEYS = {"soiling": "soiling", "shading": "shading", "snow": "snow", "mismatch": "mismatch",
             "wiring": "wiring", "connections": "connections", "lid": "lid",
             "nameplateRating": "nameplate_rating", "age": "age",
             "availabilityLoss": "availability"}

CASES = [
    dict(name="seoul clear-sky summer day, defaults", start="2025-06-20", periods=96, freq="15min",
         lt=3.0, met=False, params=dict(latitude=37.5665, longitude=126.978, altitude=38.0,
                                        surfaceTilt=30.0, surfaceAzimuth=180.0, pdc0=5000.0,
                                        gammaPdc=-0.004)),
    dict(name="tromso leap day, measured-style weather, perez, custom system", start="2024-02-29",
         periods=24, freq="1h", lt=None,
         params=dict(latitude=69.6496, longitude=18.956, altitude=100.0, surfaceTilt=60.0,
                     surfaceAzimuth=200.0, albedo=0.6, pdc0=8000.0, gammaPdc=-0.0035,
                     inverterPdc0=7000.0, etaInvNom=0.965, transposition="perez",
                     losses=dict(soiling=0.05, snow=0.1, age=0.02, availabilityLoss=0.0),
                     temperatureModel=dict(a=-2.81, b=-0.0455, tempDelta=0.0))),
    dict(name="sydney clear-sky solstice, north-facing, isotropic", start="2025-12-21", periods=48,
         freq="30min", lt=4.0,
         params=dict(latitude=-33.8688, longitude=151.2093, altitude=58.0, surfaceTilt=25.0,
                     surfaceAzimuth=0.0, pdc0=6600.0, gammaPdc=-0.0037, transposition="isotropic")),
]


def run(case):
    p = case["params"]
    t = pd.date_range(case["start"], periods=case["periods"], freq=case["freq"], tz="UTC")
    hours = np.arange(len(t)) / len(t) * 2 * math.pi
    temp_air = pd.Series(15 + 10 * np.sin(hours), index=t)
    wind = pd.Series(1 + 2 * np.abs(np.cos(hours)), index=t)
    loc = Location(p["latitude"], p["longitude"], tz="UTC", altitude=p["altitude"])
    met = case.get("met", True)
    sp = loc.get_solarposition(t, temperature=temp_air) if met else loc.get_solarposition(t)
    if case["lt"] is not None:
        sky = loc.get_clearsky(t, solar_position=sp, linke_turbidity=case["lt"])
    else:  # measured-style: clear sky reshaped to a hazy, diffuse-heavy day
        cs = loc.get_clearsky(t, solar_position=sp, linke_turbidity=5.0)
        sky = pd.DataFrame({"ghi": 0.7 * cs["ghi"], "dni": 0.5 * cs["dni"], "dhi": 1.3 * cs["dhi"]})
    weather = pd.DataFrame({"ghi": sky["ghi"], "dni": sky["dni"], "dhi": sky["dhi"]})
    if met:
        weather["temp_air"], weather["wind_speed"] = temp_air, wind
    eta = p.get("etaInvNom", 0.96)
    tm = p.get("temperatureModel", dict(a=-3.47, b=-0.0594, tempDelta=3.0))
    system = PVSystem(
        surface_tilt=p["surfaceTilt"], surface_azimuth=p["surfaceAzimuth"],
        albedo=p.get("albedo", 0.25),
        module_parameters={"pdc0": p["pdc0"], "gamma_pdc": p["gammaPdc"]},
        inverter_parameters={"pdc0": p.get("inverterPdc0", p["pdc0"] / 1.2 / eta),
                             "eta_inv_nom": eta},
        temperature_model_parameters={"a": tm["a"], "b": tm["b"], "deltaT": tm["tempDelta"]},
        losses_parameters={LOSS_KEYS[k]: v * 100 for k, v in p.get("losses", {}).items()})
    mc = ModelChain(system, loc, transposition_model=p.get("transposition", "haydavies"),
                    aoi_model="physical", spectral_model="no_loss", dc_model="pvwatts",
                    ac_model="pvwatts", losses_model="pvwatts", temperature_model="sapm",
                    airmass_model="kastenyoung1989", solar_position_method="nrel_numpy")
    mc.run_model(weather)
    r = mc.results
    out = pd.DataFrame({
        "apparentZenith": r.solar_position["apparent_zenith"],
        "azimuth": r.solar_position["azimuth"],
        "aoi": r.aoi, "ghi": weather["ghi"], "dni": weather["dni"], "dhi": weather["dhi"],
        "poaGlobal": r.total_irrad["poa_global"], "effectiveIrradiance": r.effective_irradiance,
        "tempCell": r.cell_temperature, "pdc": r.dc, "pac": r.ac})
    assert not out.isna().any().any(), case["name"]
    steps = []
    for ts, row in out.iterrows():
        step = {"timeMs": int(ts.value // 1_000_000)}
        if met:
            step |= {"tempAir": float(temp_air[ts]), "windSpeed": float(wind[ts])}
        if case["lt"] is None:
            step["weather"] = {k: float(row[k]) for k in ("ghi", "dni", "dhi")}
        step["expected"] = {k: float(v) for k, v in row.items()}
        steps.append(step)
    params = dict(p, linkeTurbidity=case["lt"]) if case["lt"] is not None else p
    return {"name": case["name"], "params": params, "steps": steps}


meta = {"reference": f"pvlib {pvlib.__version__} ModelChain (physical IAM, no spectral loss, "
                     "PVWatts DC/losses/AC, SAPM cell temperature, ΔT 67 s)"}
OUT.write_text(json.dumps({"meta": meta, "cases": [run(c) for c in CASES]}, indent=2) + "\n")
print(f"wrote {OUT}")
