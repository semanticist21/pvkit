# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1", "scipy"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Fixtures for pvkit/diode (every method), from pvlib 0.16.1.

Parameters come from the SAM libraries bundled with pvlib (CEC modules, Sandia modules,
CEC inverters, ADR inverters). The single-diode maximum power point uses
pvlib.singlediode.bishop88_mpp (brentq, xtol 1e-15, rtol 4ε) — tighter than pvlib's default
`singlediode`; every other single-diode point is pvlib's exact Lambert-W path.
JSON cannot hold NaN/±Infinity: NaN → null, ±Infinity → "Infinity"/"-Infinity".
Run: uv run scripts/fixtures/diode.py
"""

import json
import math
import os
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
import pvlib
from pvlib import inverter, pvsystem, spectrum
from pvlib import singlediode as sd

ROOT = Path(__file__).resolve().parents[2] / "packages/pvkit/src/models/diode"
rng = np.random.default_rng(20261006)
REF = f"pvlib {pvlib.__version__}"


def enc(x):
    if isinstance(x, dict):
        return {k: enc(v) for k, v in x.items()}
    if isinstance(x, (list, tuple, np.ndarray)):
        return [enc(v) for v in x]
    if isinstance(x, (bool, np.bool_)):
        return bool(x)
    if isinstance(x, (int, float, np.integer, np.floating)):
        x = float(x)
        if math.isnan(x):
            return None
        if math.isinf(x):
            return "Infinity" if x > 0 else "-Infinity"
        return x
    return x


def write(method, cases, reference=REF):
    out = ROOT / method / f"{method}-fixtures.json"
    out.write_text(json.dumps({"meta": {"reference": reference}, "cases": enc(cases)}) + "\n")
    print(f"wrote {len(cases)} cases → {out}")


cec = pvsystem.retrieve_sam("cecmod").T
cec = cec[cec["a_ref"].notna() & (cec["R_sh_ref"] > 0)]
sandia = pvsystem.retrieve_sam("sandiamod").T
inv = pvsystem.retrieve_sam("cecinverter").T
adr = pd.read_csv(Path(os.path.dirname(pvlib.__file__)) / "data/adr-library-cec-inverters-2019-03-05.csv",
                  skiprows=[1, 2])


def pick(df, n):
    return df.iloc[np.sort(rng.choice(len(df), n, replace=False))]


def conditions():
    """Operating points incl. darkness, low light, cold and hot cells."""
    fixed = [(1000.0, 25.0), (0.0, 25.0), (1.0, -20.0), (200.0, 10.0), (1200.0, 80.0)]
    pts = fixed + [(float(rng.uniform(0, 1300)), float(rng.uniform(-30, 85))) for _ in range(3)]
    return [(np.float64(s), np.float64(t)) for s, t in pts]  # numpy floats: S = 0 → Rsh = inf


# ---- calcparams-desoto / calcparams-cec ----------------------------------------------------
def cec_module(m):
    return {"alphaSc": float(m.alpha_sc), "aRef": float(m.a_ref), "iLRef": float(m.I_L_ref),
            "iORef": float(m.I_o_ref), "rShRef": float(m.R_sh_ref), "rS": float(m.R_s)}


def out5(p):
    return dict(zip(["photocurrent", "saturationCurrent", "resistanceSeries", "resistanceShunt",
                     "nNsVth"], p))


desoto, cecp, diode_params = [], [], []
for _, m in pick(cec, 15).iterrows():
    mod = cec_module(m)
    for s, t in conditions():
        desoto.append({"input": {**mod, "effectiveIrradiance": s, "tempCell": t},
                       "expected": out5(pvsystem.calcparams_desoto(s, t, m.alpha_sc, m.a_ref, m.I_L_ref,
                                                                   m.I_o_ref, m.R_sh_ref, m.R_s))})
        p = pvsystem.calcparams_cec(s, t, m.alpha_sc, m.a_ref, m.I_L_ref, m.I_o_ref, m.R_sh_ref,
                                    m.R_s, m.Adjust)
        cecp.append({"input": {**mod, "adjust": float(m.Adjust), "effectiveIrradiance": s,
                               "tempCell": t}, "expected": out5(p)})
        diode_params.append(out5(p))
# non-default band gap / reference conditions (CdTe-like)
m = cec.iloc[0]
desoto.append({"input": {**cec_module(m), "effectiveIrradiance": 700.0, "tempCell": 40.0,
                         "egRef": 1.475, "dEgdT": -0.0003, "irradRef": 800.0, "tempRef": 20.0},
               "expected": out5(pvsystem.calcparams_desoto(700.0, 40.0, m.alpha_sc, m.a_ref, m.I_L_ref,
                                                           m.I_o_ref, m.R_sh_ref, m.R_s, 1.475, -0.0003,
                                                           800.0, 20.0))})
write("calcparams-desoto", desoto)
write("calcparams-cec", cecp)

# ---- calcparams-pvsyst -------------------------------------------------------------------
cases = []
for _ in range(60):
    mod = {"alphaSc": float(rng.uniform(0.001, 0.006)), "gammaRef": float(rng.uniform(0.9, 1.4)),
           "muGamma": float(rng.uniform(-0.0006, 0.0)), "iLRef": float(rng.uniform(3, 14)),
           "iORef": float(10 ** rng.uniform(-12, -8)), "rShRef": float(rng.uniform(100, 1000)),
           "rSh0": float(rng.uniform(1000, 8000)), "rS": float(rng.uniform(0.1, 0.6)),
           "cellsInSeries": float(rng.choice([36, 60, 72, 96, 144]))}
    s, t = np.float64(rng.choice([0.0, rng.uniform(0, 1300)])), np.float64(rng.uniform(-30, 85))
    p = pvsystem.calcparams_pvsyst(s, t, mod["alphaSc"], mod["gammaRef"], mod["muGamma"], mod["iLRef"],
                                   mod["iORef"], mod["rShRef"], mod["rSh0"], mod["rS"], mod["cellsInSeries"])
    cases.append({"input": {**mod, "effectiveIrradiance": s, "tempCell": t}, "expected": out5(p)})
    diode_params.append(out5(p))
write("calcparams-pvsyst", cases)

# ---- single-diode / i-from-v / v-from-i ---------------------------------------------------
# edge parameter sets: Rs = 0, Rsh = ∞, tiny/huge I0
diode_params += [
    {"photocurrent": 6.0, "saturationCurrent": 1e-9, "resistanceSeries": 0.0, "resistanceShunt": 400.0, "nNsVth": 1.6},
    {"photocurrent": 6.0, "saturationCurrent": 1e-9, "resistanceSeries": 0.3, "resistanceShunt": math.inf, "nNsVth": 1.6},
    {"photocurrent": 9.0, "saturationCurrent": 1e-12, "resistanceSeries": 0.2, "resistanceShunt": 5000.0, "nNsVth": 2.4},
    {"photocurrent": 1.5, "saturationCurrent": 1e-6, "resistanceSeries": 1.5, "resistanceShunt": 80.0, "nNsVth": 3.0},
]
sdc, ifv, vfi = [], [], []
for p in diode_params:
    args = tuple(p.values())
    lw = pvsystem.singlediode(*args)
    if p["photocurrent"] > 0:
        i_mp, v_mp, p_mp = sd.bishop88_mpp(*args, method="brentq",
                                           method_kwargs={"xtol": 1e-15, "rtol": 4 * np.finfo(float).eps})
    else:
        i_mp, v_mp, p_mp = sd.bishop88(0.0, *args)
    i_xx = pvsystem.i_from_v(0.5 * (lw["v_oc"] + v_mp), *args)
    sdc.append({"input": p, "expected": {"iSc": lw["i_sc"], "vOc": lw["v_oc"], "iMp": i_mp, "vMp": v_mp,
                                         "pMp": p_mp, "iX": lw["i_x"], "iXx": i_xx}})
    voc = lw["v_oc"]
    for v in [0.0, 0.5 * voc, 0.9 * voc, voc, 1.05 * voc, -1.0, -5000.0]:  # -5 kV: W arg underflows
        i = pvsystem.i_from_v(v, *args)
        if math.isfinite(i):
            ifv.append({"input": {**p, "voltage": float(v)}, "expected": {"current": i}})
    isc = lw["i_sc"]
    for i in [0.0, 0.5 * isc, 0.95 * isc, isc, 1.1 * isc, isc + 10.0]:  # past Isc: W arg underflows
        v = pvsystem.v_from_i(i, *args)
        if math.isfinite(v):
            vfi.append({"input": {**p, "current": float(i)}, "expected": {"voltage": v}})
write("single-diode", sdc, f"{REF} singlediode (lambertw) + bishop88_mpp (brentq, rtol 4ε)")
write("i-from-v", ifv, f"{REF} i_from_v (lambertw)")
write("v-from-i", vfi, f"{REF} v_from_i (lambertw)")

# ---- sapm / sapm-spectral-factor / sapm-effective-irradiance -------------------------------
def sandia_module(m):
    keys = {"cellsInSeries": "Cells_in_Series", "isco": "Isco", "impo": "Impo", "voco": "Voco",
            "vmpo": "Vmpo", "aisc": "Aisc", "aimp": "Aimp", "bvoco": "Bvoco", "mbvoc": "Mbvoc",
            "bvmpo": "Bvmpo", "mbvmp": "Mbvmp", "n": "N", "c0": "C0", "c1": "C1", "c2": "C2", "c3": "C3",
            "c4": "C4", "c5": "C5", "c6": "C6", "c7": "C7", "ixo": "IXO", "ixxo": "IXXO"}
    return {k: float(m[v]) for k, v in keys.items() if not pd.isna(m[v])}


sapm_cases, f1_cases, ee_cases = [], [], []
for _, m in pick(sandia, 15).iterrows():
    mod = sandia_module(m)
    series = m.dropna()  # pvlib only emits i_x/i_xx when the keys exist
    for s, t in conditions():
        r = pvsystem.sapm(s, t, series)
        sapm_cases.append({"input": {**mod, "effectiveIrradiance": s, "tempCell": t},
                           "expected": {"iSc": r["i_sc"], "iMp": r["i_mp"], "vOc": r["v_oc"],
                                        "vMp": r["v_mp"], "pMp": r["p_mp"],
                                        **({"iX": r["i_x"]} if "i_x" in r else {}),
                                        **({"iXx": r["i_xx"]} if "i_xx" in r else {})}})
    a = {k: float(m[k.upper()]) for k in ["a0", "a1", "a2", "a3", "a4"]}
    for am in [1.0, 1.5, float(rng.uniform(1, 10)), 30.0, math.nan]:
        f1_cases.append({"input": {**a, "airmassAbsolute": am},
                         "expected": {"spectralFactor": float(spectrum.spectral_factor_sapm(am, m))}})
    for _ in range(4):
        ed, edf, am, aoi = (float(rng.uniform(0, 1000)), float(rng.uniform(0, 400)),
                            float(rng.uniform(1, 6)), float(rng.uniform(0, 89)))
        ee = pvsystem.sapm_effective_irradiance(ed, edf, am, aoi, m)
        ee_cases.append({"input": {"poaDirect": ed, "poaDiffuse": edf,
                                   "spectralFactor": float(spectrum.spectral_factor_sapm(am, m)),
                                   "iam": float(pvlib.iam.sapm(aoi, m)), "fd": float(m.FD)},
                         "expected": {"effectiveIrradiance": float(ee)}})
write("sapm", sapm_cases)
write("sapm-spectral-factor", f1_cases)
write("sapm-effective-irradiance", ee_cases, f"{REF} sapm_effective_irradiance")

# ---- inverter-sandia ---------------------------------------------------------------------
cases = []
for _, m in pick(inv[inv["Pnt"].notna()], 30).iterrows():
    par = {"paco": m.Paco, "pdco": m.Pdco, "vdco": m.Vdco, "pso": m.Pso, "c0": m.C0, "c1": m.C1,
           "c2": m.C2, "c3": m.C3, "pnt": m.Pnt}
    for pdc in [0.0, 0.5 * m.Pso, m.Pso, float(rng.uniform(m.Pso, m.Pdco)), 1.3 * m.Pdco]:
        vdc = float(rng.uniform(m.Mppt_low, m.Mppt_high))
        cases.append({"input": {**par, "vdc": vdc, "pdc": float(pdc)},
                      "expected": {"pac": float(inverter.sandia(vdc, pdc, m))}})
write("inverter-sandia", cases)

# ---- inverter-adr ------------------------------------------------------------------------
cases = []
for _, m in pick(adr.dropna(subset=["Vmin", "Vmax", "Vdcmax", "MPPTLow", "MPPTHi", "Pnt"]), 30).iterrows():
    coeffs = [float(c) for c in m.ADRCoefficients.strip("[]").split()]
    pvl = {"Pnom": m.Pnom, "Vnom": m.Vnom, "Pacmax": m.Pacmax, "Pnt": m.Pnt, "ADRCoefficients": coeffs,
           "Vmax": m.Vmax, "Vmin": m.Vmin, "Vdcmax": m.Vdcmax, "MPPTHi": m.MPPTHi, "MPPTLow": m.MPPTLow}
    par = {"pNom": m.Pnom, "vNom": m.Vnom, "pacMax": m.Pacmax, "pnt": m.Pnt, "adrCoefficients": coeffs,
           "vMax": m.Vmax, "vMin": m.Vmin, "vdcMax": m.Vdcmax, "mpptHigh": m.MPPTHi, "mpptLow": m.MPPTLow}
    for vdc, pdc in [(m.Vnom, 0.5 * m.Pnom), (0.0, 100.0), (m.Vnom, 0.0), (5.0 * m.Vdcmax, 100.0),
                     (float(rng.uniform(m.MPPTLow, m.MPPTHi)), float(rng.uniform(0, 1.2 * m.Pnom)))]:
        cases.append({"input": {**par, "vdc": float(vdc), "pdc": float(pdc)},
                      "expected": {"pac": float(inverter.adr(np.float64(vdc), np.float64(pdc), pvl))}})
# NaN voltage limits (np.nanmax ignores them; all NaN → no bound) on the last row, at its nominal point
for nan_keys in [["MPPTHi", "MPPTLow"], ["Vmax", "Vmin", "Vdcmax", "MPPTHi", "MPPTLow"]]:
    pvl_nan = {**pvl, **{k: math.nan for k in nan_keys}}
    par_nan = {"pNom": m.Pnom, "vNom": m.Vnom, "pacMax": m.Pacmax, "pnt": m.Pnt, "adrCoefficients": coeffs,
               "vMax": pvl_nan["Vmax"], "vMin": pvl_nan["Vmin"], "vdcMax": pvl_nan["Vdcmax"],
               "mpptHigh": pvl_nan["MPPTHi"], "mpptLow": pvl_nan["MPPTLow"]}
    for vdc in [m.Vnom, 5.0 * m.Vdcmax]:
        with warnings.catch_warnings():  # all-NaN nanmax warns; the NaN bound is the point
            warnings.simplefilter("ignore", RuntimeWarning)
            pac = inverter.adr(np.float64(vdc), np.float64(0.5 * m.Pnom), pvl_nan)
        cases.append({"input": {**par_nan, "vdc": float(vdc), "pdc": float(0.5 * m.Pnom)},
                      "expected": {"pac": float(pac)}})
write("inverter-adr", cases)
