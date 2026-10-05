# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""End-to-end fixture: sun position → clear-sky → Perez POA → SAPM cell temp → PVWatts DC/AC → kWh.

Mirrors pvlib's ModelChain-style manual chain with every parameter explicit, so the TS
pipeline test (packages/core/src/pipeline.test.ts) checks that pvkit modules compose.
Run: uv run scripts/fixtures/pipeline.py
"""

import json
from pathlib import Path

import pandas as pd
import pvlib

OUT = Path(__file__).resolve().parents[2] / "packages/core/src/pipeline-fixtures.json"
P = dict(latitude=37.5665, longitude=126.978, altitude=38.0, linkeTurbidity=3.0, surfaceTilt=30.0,
         surfaceAzimuth=180.0, albedo=0.25, tempAir=25.0, windSpeed=1.0, pdc0=5000.0,
         gammaPdc=-0.004, inverterPdc0=4500.0, etaInvNom=0.96, stepMinutes=15)

t = pd.date_range("2025-06-20", "2025-06-23", freq=f"{P['stepMinutes']}min", tz="UTC", inclusive="left")
sp = pvlib.solarposition.spa_python(t, P["latitude"], P["longitude"], altitude=P["altitude"],
                                    pressure=101325.0, temperature=12.0, delta_t=67.0,
                                    atmos_refract=0.5667, how="numpy")
am_rel = pvlib.atmosphere.get_relative_airmass(sp["apparent_zenith"], model="kastenyoung1989")
pressure = pvlib.atmosphere.alt2pres(P["altitude"])
am_abs = pvlib.atmosphere.get_absolute_airmass(am_rel, pressure)
dni_extra = pvlib.irradiance.get_extra_radiation(t, solar_constant=1366.1, method="spencer")
cs = pvlib.clearsky.ineichen(sp["apparent_zenith"], am_abs, P["linkeTurbidity"],
                             altitude=P["altitude"], dni_extra=dni_extra, perez_enhancement=False)
poa = pvlib.irradiance.get_total_irradiance(
    P["surfaceTilt"], P["surfaceAzimuth"], sp["apparent_zenith"], sp["azimuth"],
    cs["dni"], cs["ghi"], cs["dhi"], dni_extra=dni_extra, airmass=am_rel, albedo=P["albedo"],
    model="perez", model_perez="allsitescomposite1990")
tcell = pvlib.temperature.sapm_cell(poa["poa_global"], P["tempAir"], P["windSpeed"],
                                    a=-3.47, b=-0.0594, deltaT=3.0)
pdc = pvlib.pvsystem.pvwatts_dc(poa["poa_global"], tcell, pdc0=P["pdc0"], gamma_pdc=P["gammaPdc"])
pac = pvlib.inverter.pvwatts(pdc, pdc0=P["inverterPdc0"], eta_inv_nom=P["etaInvNom"])

steps = [{"timeMs": int(ts.value // 1_000_000), "poaGlobal": float(g), "tempCell": float(c),
          "pac": float(a)} for ts, g, c, a in zip(t, poa["poa_global"], tcell, pac)]
energy = float(pac.sum() * P["stepMinutes"] / 60 / 1000)
meta = {"reference": f"pvlib {pvlib.__version__} manual chain (spa_python, kastenyoung1989, "
                     "ineichen, get_total_irradiance perez, sapm_cell, pvwatts_dc, inverter.pvwatts)"}
OUT.write_text(json.dumps({"meta": meta, "params": P, "steps": steps, "energyKwh": energy}, indent=2) + "\n")
print(f"wrote {len(steps)} steps, {energy:.6f} kWh → {OUT}")
