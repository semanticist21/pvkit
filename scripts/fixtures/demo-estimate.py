# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for apps/demo estimate(): the demo's clear-sky chain, month by month, in pvlib.

get_solarposition nrel_numpy (ΔT 67 s), kastenyoung1989, spencer, ineichen, perez (albedo
0.25), sapm_cell open_rack_glass_polymer at wind 1, pvwatts_dc, inverter.pvwatts at
pdc0 / 1.2 / 0.96; mid-hour samples, month bounds shifted by round(longitude / 15) h.
Run: uv run scripts/fixtures/demo-estimate.py
"""

import json
from pathlib import Path

import numpy as np
import pandas as pd
from pvlib import atmosphere as atm
from pvlib import clearsky, inverter, pvsystem, temperature
from pvlib import irradiance as irr
from pvlib import solarposition as sp

OUT = Path(__file__).resolve().parents[2] / "apps/demo/src/estimate-fixtures.json"
META = {"reference": "pvlib 0.16.1, chain as in scripts/fixtures/demo-estimate.py"}


def monthly_kwh(i):
    lat, lon, alt = i["latitude"], i["longitude"], i["altitude"]
    off = round(lon / 15)
    pdc0 = i["dcKw"] * 1000
    out = []
    for m in range(12):
        start = pd.Timestamp(2025, m + 1, 1, tz="UTC") - pd.Timedelta(hours=off)
        end = (pd.Timestamp(2025, m + 2, 1, tz="UTC") if m < 11
               else pd.Timestamp(2026, 1, 1, tz="UTC")) - pd.Timedelta(hours=off)
        t = pd.date_range(start + pd.Timedelta(minutes=30), end, freq="h", inclusive="left")
        pos = sp.get_solarposition(t, lat, lon, altitude=alt, method="nrel_numpy", delta_t=67.0)
        zen = pos["apparent_zenith"].to_numpy()
        up = zen < 90
        t, pos, zen = t[up], pos[up], zen[up]
        amr = atm.get_relative_airmass(zen, model="kastenyoung1989")
        dni_extra = irr.get_extra_radiation(t, method="spencer").to_numpy()
        ama = atm.get_absolute_airmass(amr, atm.alt2pres(alt))
        cs = clearsky.ineichen(zen, ama, i["linkeTurbidity"], altitude=alt, dni_extra=dni_extra)
        poa = irr.get_total_irradiance(
            i["tilt"], i["azimuth"], zen, pos["azimuth"].to_numpy(), cs["dni"], cs["ghi"],
            cs["dhi"], dni_extra=dni_extra, airmass=amr, albedo=0.25, model="perez",
        )["poa_global"]
        poa = np.asarray(poa, dtype=float)
        poa = poa[poa > 0]
        p = temperature.TEMPERATURE_MODEL_PARAMETERS["sapm"]["open_rack_glass_polymer"]
        tc = temperature.sapm_cell(poa, i["tempAir"], 1.0, **p)
        pdc = pvsystem.pvwatts_dc(poa, tc, pdc0, -0.0037)
        ac = inverter.pvwatts(pdc * (1 - i["losses"]), pdc0 / 1.2 / 0.96, eta_inv_nom=0.96)
        out.append(float(np.sum(ac)) / 1000)
    return out


seoul = {"latitude": 37.5665, "longitude": 126.978, "altitude": 38, "tilt": 30, "azimuth": 180,
         "dcKw": 5, "losses": 0.14, "linkeTurbidity": 3, "tempAir": 20}
los_angeles = {**seoul, "latitude": 34.05, "longitude": -118.25, "altitude": 100, "tilt": 20}
cases = [{"input": i, "monthlyKwh": monthly_kwh(i)} for i in (seoul, los_angeles)]
OUT.write_text(json.dumps({"meta": META, "cases": cases}, indent=2) + "\n")
print(f"wrote {len(cases)} cases → {OUT.name}")
