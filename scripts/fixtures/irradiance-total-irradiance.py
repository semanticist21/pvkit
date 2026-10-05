# /// script
# requires-python = ">=3.11"
# dependencies = ["pvlib==0.16.1"]
# ///
"""Fixtures for @pvkit/core irradiance transposition: isotropic, klucher, hay-davies, reindl,
perez, ground-diffuse, poa-components and total-irradiance (one JSON per method, one
shared scenario set). Also writes perez/perez-coefficients.ts from pvlib's Perez tables.

Run: uv run scripts/fixtures/irradiance-total-irradiance.py
JSON has no NaN/±Infinity: non-finite numbers are written as the strings "NaN", "Infinity",
"-Infinity" (tests decode with Number()).
"""

import inspect
import json
import math
import re
import warnings
from pathlib import Path

import numpy as np
import pvlib
from pvlib import irradiance as irr

warnings.simplefilter("ignore")  # numpy divide warnings
DIR = Path(__file__).resolve().parents[2] / "packages/core/src/models/irradiance"
REF = f"@ pvlib {pvlib.__version__}"
PEREZ_MODELS = re.findall(r"'(\w+)': \[", inspect.getsource(irr._get_perez_coefficients))


def enc(x):
    x = float(x)
    if math.isnan(x):
        return "NaN"
    if math.isinf(x):
        return "Infinity" if x > 0 else "-Infinity"
    return x


def scenario(tilt, saz, zen, az, dni, ghi, dhi, dni_extra=1366.1, albedo=0.25):
    am = float(pvlib.atmosphere.get_relative_airmass(zen, model="kastenyoung1989"))
    # np.float64 so pvlib yields NaN/±inf (as with arrays) instead of raising ZeroDivisionError
    return {k: np.float64(v) for k, v in dict(
        surfaceTilt=tilt, surfaceAzimuth=saz, solarZenith=zen, solarAzimuth=az, dni=dni, ghi=ghi,
        dhi=dhi, dniExtra=dni_extra, airmassRelative=am, albedo=albedo).items()}


S = [
    scenario(30.0, 180.0, 30.0, 180.0, 0.0, 0.0, 0.0),        # zero irradiance
    scenario(30.0, 180.0, 30.0, 180.0, 900.0, 779.4, 0.0),    # dhi = 0, dni > 0
    scenario(30.0, 180.0, 40.0, 150.0, 0.0, 120.0, 120.0),    # overcast, dni = 0
    scenario(30.0, 180.0, 40.0, 150.0, 0.0, 0.0, 50.0),       # ghi = 0, dhi > 0 (inconsistent)
    scenario(30.0, 180.0, 40.0, 150.0, 100.0, 70.0, -2.0),    # negative dhi (sensor offset)
    scenario(30.0, 180.0, 85.0, 120.0, 200.0, 47.0, 30.0),
    scenario(30.0, 90.0, 87.0, 90.0, 150.0, 30.0, 22.0),
    scenario(90.0, 90.0, 89.9, 90.0, 50.0, 10.0, 10.0),
    scenario(30.0, 180.0, 90.0, 270.0, 0.0, 5.0, 5.0),        # sun on horizon
    scenario(30.0, 180.0, 92.0, 300.0, 0.0, 2.0, 2.0),        # sun below horizon: airmass NaN
    scenario(30.0, 180.0, 100.0, 330.0, 0.0, 0.0, 0.0),
    scenario(0.0, 180.0, 35.0, 200.0, 700.0, 700.0, 126.6),   # flat
    scenario(90.0, 180.0, 50.0, 0.0, 600.0, 500.0, 114.3),    # vertical, sun behind
    scenario(180.0, 0.0, 30.0, 180.0, 800.0, 800.0, 107.2),   # face-down
    scenario(25.0, 180.0, 10.0, 180.0, 1050.0, 1150.0, 116.0, 1412.0, 0.9),
    scenario(60.0, 200.0, 70.0, 230.0, 1000.0, 400.0, 58.0, 1325.0, 0.05),
]
rng = np.random.default_rng(20261005)


def rand(zlo, zhi, tilt_hi=90.0):
    zen = float(rng.uniform(zlo, zhi))
    dni = float(rng.uniform(0, 1000))
    dhi = float(rng.uniform(5, 400))
    ghi = dhi + max(dni * math.cos(math.radians(zen)), 0.0)
    return scenario(float(rng.uniform(0, tilt_hi)), float(rng.uniform(0, 360)), zen,
                    float(rng.uniform(0, 360)), dni, ghi, dhi, float(rng.uniform(1320, 1415)),
                    float(rng.uniform(0.05, 0.9)))


S += [rand(0, 89, 180.0 if i % 10 == 0 else 90.0) for i in range(120)]
S += [rand(85, 95) for _ in range(30)]


def pick(s, keys):
    return {k: s[k] for k in keys}


GEO = ["surfaceTilt", "surfaceAzimuth"]
SUN = ["solarZenith", "solarAzimuth"]


def write(method, ref, cases):
    out = DIR / method / f"{method}-fixtures.json"
    cases = [{"input": {k: enc(v) if isinstance(v, float) else v for k, v in c["input"].items()},
              "expected": {k: enc(v) for k, v in c["expected"].items()}
              if isinstance(c["expected"], dict) else enc(c["expected"])} for c in cases]
    out.write_text(json.dumps({"meta": {"reference": f"{ref} {REF}"}, "cases": cases}, indent=1) + "\n")
    print(f"wrote {len(cases)} cases → {out}")


def run(method, ref, keys, fn):
    write(method, ref, [{"input": pick(s, keys), "expected": fn(s)} for s in S])


run("isotropic", "pvlib.irradiance.isotropic", ["surfaceTilt", "dhi"],
    lambda s: irr.isotropic(s["surfaceTilt"], s["dhi"]))
run("klucher", "pvlib.irradiance.klucher", GEO + ["dhi", "ghi"] + SUN,
    lambda s: irr.klucher(s["surfaceTilt"], s["surfaceAzimuth"], s["dhi"], s["ghi"],
                          s["solarZenith"], s["solarAzimuth"]))
run("hay-davies", "pvlib.irradiance.haydavies", GEO + ["dhi", "dni", "dniExtra"] + SUN,
    lambda s: irr.haydavies(s["surfaceTilt"], s["surfaceAzimuth"], s["dhi"], s["dni"],
                            s["dniExtra"], s["solarZenith"], s["solarAzimuth"]))
run("reindl", "pvlib.irradiance.reindl", GEO + ["dhi", "dni", "ghi", "dniExtra"] + SUN,
    lambda s: irr.reindl(s["surfaceTilt"], s["surfaceAzimuth"], s["dhi"], s["dni"], s["ghi"],
                         s["dniExtra"], s["solarZenith"], s["solarAzimuth"]))
run("ground-diffuse", "pvlib.irradiance.get_ground_diffuse", ["surfaceTilt", "ghi", "albedo"],
    lambda s: irr.get_ground_diffuse(s["surfaceTilt"], s["ghi"], albedo=s["albedo"]))

perez_cases = []
for i, s in enumerate(S):
    m = PEREZ_MODELS[i % len(PEREZ_MODELS)]
    v = irr.perez(s["surfaceTilt"], s["surfaceAzimuth"], s["dhi"], s["dni"], s["dniExtra"],
                  s["solarZenith"], s["solarAzimuth"], s["airmassRelative"], model=m)
    perez_cases.append({"input": {**pick(s, GEO + ["dhi", "dni", "dniExtra"] + SUN + ["airmassRelative"]),
                                  "model": m}, "expected": v})
write("perez", "pvlib.irradiance.perez (airmass: get_relative_airmass kastenyoung1989)", perez_cases)

poa_cases = []
for _ in range(60):
    a, dni = float(rng.uniform(0, 180)), float(rng.uniform(0, 1100))
    sky, gnd = float(rng.uniform(0, 500)), float(rng.uniform(0, 150))
    r = irr.poa_components(a, dni, sky, gnd)
    poa_cases.append({"input": dict(aoi=a, dni=dni, poaSkyDiffuse=sky, poaGroundDiffuse=gnd),
                      "expected": {"poaGlobal": r["poa_global"], "poaDirect": r["poa_direct"],
                                   "poaDiffuse": r["poa_diffuse"], "poaSkyDiffuse": r["poa_sky_diffuse"],
                                   "poaGroundDiffuse": r["poa_ground_diffuse"]}})
write("poa-components", "pvlib.irradiance.poa_components", poa_cases)

MODELS = ["isotropic", "klucher", "haydavies", "reindl", "perez"]
total_cases = []
for i, s in enumerate(S[:16] + S[16:][::5]):
    for j, model in enumerate(MODELS if i < 16 else [MODELS[i % len(MODELS)]]):
        pm = PEREZ_MODELS[(i + j) % len(PEREZ_MODELS)]
        r = irr.get_total_irradiance(
            s["surfaceTilt"], s["surfaceAzimuth"], s["solarZenith"], s["solarAzimuth"], s["dni"],
            s["ghi"], s["dhi"], dni_extra=s["dniExtra"], airmass=s["airmassRelative"],
            albedo=s["albedo"], surface_type=None, model=model, model_perez=pm,
            diffuse_components=False)
        inp = {**pick(s, GEO + SUN + ["dni", "ghi", "dhi", "albedo"]), "model": model}
        if model in ("haydavies", "reindl", "perez"):
            inp["dniExtra"] = s["dniExtra"]
        if model == "perez":
            inp["airmassRelative"] = s["airmassRelative"]
            inp["perezModel"] = pm
        total_cases.append({"input": inp, "expected": {
            "poaGlobal": r["poa_global"], "poaDirect": r["poa_direct"], "poaDiffuse": r["poa_diffuse"],
            "poaSkyDiffuse": r["poa_sky_diffuse"], "poaGroundDiffuse": r["poa_ground_diffuse"]}})
write("total-irradiance", "pvlib.irradiance.get_total_irradiance (explicit airmass, surface_type=None)",
      total_cases)

rows = []
for m in PEREZ_MODELS:
    f1, f2 = irr._get_perez_coefficients(m)
    body = "\n".join(f"    [{', '.join(repr(float(x)) for x in [*a, *b])}]," for a, b in zip(f1, f2))
    rows.append(f"  {m}: [\n{body}\n  ],")
(DIR / "perez" / "perez-coefficients.ts").write_text(f'''// biome-ignore-all lint/suspicious/noApproximativeNumericConstant: published coefficients (1.442 ≠ log2 e), keep verbatim
/**
 * Perez sky-diffuse coefficient sets — Perez et al. (1990) Solar Energy 44(5) Table 6
 * ("allsitescomposite1990") and Perez et al. (1988) SAND88-7030 (the "*1988" sets).
 * Generated by scripts/fixtures/irradiance-total-irradiance.py from pvlib {pvlib.__version__}
 * `pvlib.irradiance._get_perez_coefficients`. Do not hand-edit.
 */

type Row = readonly [f11: number, f12: number, f13: number, f21: number, f22: number, f23: number];

/** 8 rows per set, one per sky-clearness bin ε: [1, 1.065, 1.23, 1.5, 1.95, 2.8, 4.5, 6.2, ∞). */
export const PEREZ_COEFFICIENTS = {{
{chr(10).join(rows)}
}} as const satisfies Record<string, readonly Row[]>;

/** Name of a Perez coefficient set. */
export type PerezModel = keyof typeof PEREZ_COEFFICIENTS;
''')
print("wrote perez-coefficients.ts")
