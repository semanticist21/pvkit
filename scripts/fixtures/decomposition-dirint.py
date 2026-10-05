# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# ///
"""Fixtures for @pvkit/core decomposition/dirint and decomposition/dirindex, plus the DIRINT
coefficient table, from pvlib.irradiance.dirint / dirindex / _get_dirint_coeffs.

Run: uv run scripts/fixtures/decomposition-dirint.py
Writes:
  packages/core/src/models/decomposition/dirint/dirint-coefficients.ts
  packages/core/src/models/decomposition/dirint/dirint-fixtures.json
  packages/core/src/models/decomposition/dirindex/dirindex-fixtures.json
pvlib runs on whole pandas series (so ΔKt' uses real neighbours); each emitted case records
the previous/next sample the scalar TS function needs (absent at series edges). NaN → null,
±inf → "Infinity"/"-Infinity".
"""

import json
import math
from pathlib import Path

import numpy as np
import pandas as pd
import pvlib

DIR = Path(__file__).resolve().parents[2] / "packages/core/src/models/decomposition"


def num(x):
    x = float(x)
    if math.isinf(x):  # dirindex: clear-sky DIRINT 0 with all-sky DIRINT > 0
        return "Infinity" if x > 0 else "-Infinity"
    return None if math.isnan(x) else x


# --- coefficient table ------------------------------------------------------------------
coeffs = pvlib.irradiance._get_dirint_coeffs()  # shape (6 kt', 6 zenith, 7 ΔKt', 5 w)
assert coeffs.shape == (6, 6, 7, 5)
rows = []
for k in range(6):
    zs = []
    for z in range(6):
        ds = ",\n".join("      [" + ", ".join(repr(float(v)) for v in coeffs[k, z, d]) + "]"
                        for d in range(7))
        zs.append("    [\n" + ds + ",\n    ]")
    rows.append("  [\n" + ",\n".join(zs) + ",\n  ]")
(DIR / "dirint/dirint-coefficients.ts").write_text(
    "/**\n"
    " * DIRINT correction-coefficient table — Perez et al. (1992), \"Dynamic Global-to-Direct\n"
    " * Irradiance Conversion Models\", ASHRAE Transactions 98(1):354–369.\n"
    f" * Extracted programmatically from pvlib {pvlib.__version__} `irradiance._get_dirint_coeffs()` by\n"
    " * `scripts/fixtures/decomposition-dirint.py`. Do not hand-edit.\n"
    " *\n"
    " * Indexed `[ktPrimeBin][zenithBin][deltaKtPrimeBin][wBin]`, all 0-based\n"
    " * (6 × 6 × 7 × 5); ΔKt' bin 6 = stability unknown, w bin 4 = dew point unknown.\n"
    " */\n"
    "export const DIRINT_COEFFS: readonly (readonly (readonly (readonly number[])[])[])[] = [\n"
    + ",\n".join(rows) + ",\n];\n")

# --- time series ------------------------------------------------------------------------
rng = np.random.default_rng(20261005)


def series(start, periods, freq, lat, lon, pressure, use_dkt, with_dew,
           cloud_range=(0.15, 1.08), noise=3.0):
    times = pd.date_range(start, periods=periods, freq=freq, tz="UTC")
    sp = pvlib.solarposition.spa_python(times, lat, lon, delta_t=67.0)
    zen = sp["zenith"]
    am = pvlib.atmosphere.get_absolute_airmass(
        pvlib.atmosphere.get_relative_airmass(sp["apparent_zenith"]), 101325.0)
    cs = pvlib.clearsky.ineichen(sp["apparent_zenith"], am, 3.0, altitude=0.0,
                                 dni_extra=pvlib.irradiance.get_extra_radiation(times))
    cloud = rng.uniform(*cloud_range, periods)
    ghi = cs["ghi"] * cloud + rng.uniform(-noise, noise, periods)
    dew = pd.Series(rng.uniform(-25, 25, periods), index=times) if with_dew else None
    args = dict(pressure=pressure, use_delta_kt_prime=use_dkt, temp_dew=dew,
                min_cos_zenith=0.065, max_zenith=87.0)
    dni = pvlib.irradiance.dirint(ghi, zen, times, **args)
    dix = pvlib.irradiance.dirindex(ghi, cs["ghi"], cs["dni"], zen, times, **args)
    return times, zen, ghi, cs, dew, dni, dix, pressure, use_dkt


def emit(s, picks, out_dirint, out_dirindex):
    times, zen, ghi, cs, dew, dni, dix, pressure, use_dkt = s
    ms = (times.as_unit("ms").asi8).tolist()
    n = len(times)

    def nb(j, clear):
        if j < 0 or j >= n:
            return None
        d = {"ghi": float(ghi.iloc[j]), "solarZenith": float(zen.iloc[j]), "timeMs": ms[j]}
        if clear:
            d["ghiClearsky"] = float(cs["ghi"].iloc[j])
        return d

    for i in picks:
        base = {"solarZenith": float(zen.iloc[i]), "timeMs": ms[i], "pressure": pressure,
                "useDeltaKtPrime": use_dkt, "minCosZenith": 0.065, "maxZenith": 87.0}
        if dew is not None:
            base["tempDew"] = float(dew.iloc[i])
        for clear, out, val in ((False, out_dirint, dni), (True, out_dirindex, dix)):
            inp = {"ghi": float(ghi.iloc[i])}
            if clear:
                inp |= {"ghiClearsky": float(cs["ghi"].iloc[i]),
                        "dniClearsky": float(cs["dni"].iloc[i])}
            inp |= base
            for key, j in (("previous", i - 1), ("next", i + 1)):
                v = nb(j, clear)
                if v is not None:
                    inp[key] = v
            out.append({"input": inp, "expected": {"dni": num(val.iloc[i])}})


cases_dirint, cases_dirindex = [], []
# Golden CO, hourly, two summer days: full day/night cycle incl. series edges.
s = series("2024-06-20", 48, "1h", 39.742, -105.179, 82000.0, True, True)
emit(s, range(48), cases_dirint, cases_dirindex)
# Seoul, 15-min, no pressure correction, no dew point.
s = series("2024-03-20 20:00", 96, "15min", 37.5665, 126.978, None, True, False)
emit(s, range(0, 96, 3), cases_dirint, cases_dirindex)
# Sydney, hourly, ΔKt' disabled, dew point given.
s = series("2024-12-21 18:00", 24, "1h", -33.869, 151.209, 101325.0, False, True)
emit(s, range(24), cases_dirint, cases_dirindex)
# Tromsø winter: low sun, near-horizon zeniths, 10-min.
s = series("2024-02-20 08:00", 36, "10min", 69.65, 18.96, 100000.0, True, True)
emit(s, range(36), cases_dirint, cases_dirindex)
# Very clear, stable midday (kt' ≥ 0.8, ΔKt' < 0.015 bins) and steady overcast (kt' < 0.24).
s = series("2024-06-20 15:00", 12, "5min", 39.742, -105.179, 82000.0, True, True,
           cloud_range=(1.22, 1.221), noise=0.0)
emit(s, range(12), cases_dirint, cases_dirindex)
s = series("2024-06-20 15:00", 12, "5min", 39.742, -105.179, 82000.0, True, False,
           cloud_range=(0.24, 0.245), noise=0.0)
emit(s, range(12), cases_dirint, cases_dirindex)
# Single-sample series: ΔKt' has no neighbour → NaN.
s = series("2024-06-20 18:00", 1, "1h", 39.742, -105.179, 101325.0, True, False)
emit(s, [0], cases_dirint, cases_dirindex)

for name, cases, fn in (("dirint", cases_dirint, "dirint"),
                        ("dirindex", cases_dirindex, "dirindex")):
    meta = {"reference": f"pvlib.irradiance.{fn} @ pvlib {pvlib.__version__}",
            "clearsky": "pvlib.clearsky.ineichen(linke_turbidity=3) for synthetic series",
            "nan": "null", "inf": "\"Infinity\""}
    out = DIR / f"{name}/{name}-fixtures.json"
    out.write_text(json.dumps({"meta": meta, "cases": cases}, indent=2) + "\n")
    print(f"wrote {len(cases)} cases → {out}")
