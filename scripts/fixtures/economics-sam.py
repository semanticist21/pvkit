# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy==2.3.3", "nrel-pysam==7.1.1.post1"]
# [tool.uv]
# exclude-newer = "2026-10-06T00:00:00Z"
# ///
"""Independent-convention fixtures for pvkit/economics, computed by NREL SAM (PySAM 7.1.1).

economics.py pins the arithmetic against the spec formula restated in Python; this script
pins the conventions against SAM's own compute modules:
- lifetime-energy: Utilityrate5 lifetime degradation (net billing, no load, buy = sell = 1/kWh,
  so `annual_energy_value[t]` is year t's degraded energy).
- bill-savings: Utilityrate5 net billing (`ur_metering_option` 2), flat and TOU energy rates,
  `savings_year1`.
- lcoe: Lcoefcr with fixed_charge_rate = capital recovery factor, equal to pvkit's discounted
  form for year-0 capital and constant annual O&M and energy.
Hourly series are a 24-h profile repeated 365 days (non-leap year), stored once per case.
Run: uv run scripts/fixtures/economics-sam.py
"""

import json
import math
from pathlib import Path

import numpy as np
import PySAM.Lcoefcr as Lcoefcr
import PySAM.Utilityrate5 as Utilityrate5

ROOT = Path(__file__).resolve().parents[2] / "packages/pvkit/src/models/economics"
rng = np.random.default_rng(20261007)
DAYS = 365


def write(method, cases, reference):
    out = ROOT / method / f"{method}-sam-fixtures.json"
    out.write_text(json.dumps({"meta": {"reference": reference}, "cases": cases}) + "\n")
    print(f"wrote {len(cases)} cases → {out}")


def day_profile(peak):
    """Rounded diurnal PV shape with random noise, kWh per hour."""
    h = np.arange(24)
    shape = np.clip(np.sin(np.pi * (h - 6) / 12), 0, None) * rng.uniform(0.7, 1.0, 24)
    return [round(float(v), 3) for v in peak * shape]


def utility_rate(gen_day, load_day, years, degradation_pct, tou_periods):
    """tou_periods: list of (buy, sell) per period; hours 16–20 use period 2 when present."""
    u = Utilityrate5.new()
    sched = [[2 if len(tou_periods) > 1 and 16 <= h <= 20 else 1 for h in range(24)]] * 12
    values = {
        "Lifetime": {
            "system_use_lifetime_output": 0,
            "analysis_period": years,
            "inflation_rate": 0,
        },
        "SystemOutput": {"gen": gen_day * DAYS, "degradation": [degradation_pct]},
        "Load": {"load": load_day * DAYS, "load_escalation": [0]},
        "ElectricityRates": {
            "en_electricity_rates": 1,
            "ur_metering_option": 2,
            "rate_escalation": [0],
            "ur_monthly_fixed_charge": 0,
            "ur_monthly_min_charge": 0,
            "ur_annual_min_charge": 0,
            "ur_en_ts_sell_rate": 0,
            "ur_en_ts_buy_rate": 0,
            "ur_dc_enable": 0,
            "ur_sell_eq_buy": 0,
            "ur_nm_yearend_sell_rate": 0,
            "ur_nm_credit_month": 0,
            "ur_nm_credit_rollover": 0,
            "ur_yearzero_usage_peaks": [0] * 12,
            "ur_ec_sched_weekday": sched,
            "ur_ec_sched_weekend": sched,
            "ur_ec_tou_mat": [
                [p + 1, 1, 1e38, 0, buy, sell] for p, (buy, sell) in enumerate(tou_periods)
            ],
        },
    }
    for group, kv in values.items():
        for k, v in kv.items():
            setattr(getattr(u, group), k, v)
    u.execute()
    return u  # keep the model alive: its Outputs die with it


# lifetime-energy: no load, buy = sell = 1 → annual energy value = degraded annual energy
cases = []
for i in range(6):
    gen_day = day_profile(rng.uniform(1, 50))
    d = [0.0, 0.5, 0.8][i] if i < 3 else round(float(rng.uniform(0, 2)), 3)
    years = [1, 25, 30][i] if i < 3 else int(rng.integers(2, 41))
    model = utility_rate(gen_day, [0.0] * 24, years, d, [(1.0, 1.0)])
    cases.append(
        {
            "input": {
                "firstYearEnergy": math.fsum(gen_day * DAYS),
                "degradationRate": d / 100,
                "years": years,
            },
            "expected": {"annual": list(model.Outputs.annual_energy_value[1:])},
        }
    )
write("lifetime-energy", cases, "NREL SAM Utilityrate5 (PySAM 7.1.1.post1) annual_energy_value")

# bill-savings: year-1 net billing savings, flat and TOU rates
cases = []
for i in range(6):
    gen_day = day_profile(rng.uniform(1, 10))
    load_day = [round(float(v), 3) for v in rng.uniform(0.2, 3.0, 24)]
    buy = round(float(rng.uniform(0.08, 0.4)), 4)
    sell = round(float(rng.uniform(0, buy)), 4)
    periods = [(buy, sell)]
    if i % 2:
        periods.append((round(buy * 1.8, 4), round(sell * 0.5, 4)))
    model = utility_rate(gen_day, load_day, 1, 0, periods)
    hourly = [periods[1] if len(periods) > 1 and 16 <= h <= 20 else periods[0] for h in range(24)]
    cases.append(
        {
            "input": {
                "productionDay": gen_day,
                "loadDay": load_day,
                "importPriceDay": [b for b, _ in hourly],
                "exportPriceDay": [s for _, s in hourly],
            },
            "expected": {"savings": model.Outputs.savings_year1},
        }
    )
write("bill-savings", cases, "NREL SAM Utilityrate5 (PySAM 7.1.1.post1) net billing savings_year1")

# lcoe: Lcoefcr with FCR = capital recovery factor
cases = []
for _ in range(8):
    capex = round(float(rng.uniform(1e3, 1e7)), 2)
    om = round(float(capex * rng.uniform(0.005, 0.03)), 2)
    energy = round(float(capex * rng.uniform(0.5, 3)), 1)
    r = round(float(rng.uniform(0.01, 0.12)), 4)
    n = int(rng.integers(5, 41))
    m = Lcoefcr.new()
    s = m.SimpleLCOE
    s.capital_cost = capex
    s.fixed_charge_rate = r * (1 + r) ** n / ((1 + r) ** n - 1)
    s.fixed_operating_cost = om
    s.variable_operating_cost = 0
    s.annual_energy = energy
    m.execute()
    cases.append(
        {
            "input": {
                "capitalCost": capex,
                "omCost": om,
                "annualEnergy": energy,
                "discountRate": r,
                "years": n,
            },
            "expected": {"lcoe": m.Outputs.lcoe_fcr},
        }
    )
write("lcoe", cases, "NREL SAM Lcoefcr (PySAM 7.1.1.post1) lcoe_fcr, FCR = CRF(r, n)")
