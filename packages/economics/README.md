# @pvkit/economics

Solar ROI and payback calculator in TypeScript — the "kWh → money" step of a PV quote:
lifetime energy with degradation, bill savings (self-consumption vs export), cash flows,
NPV, IRR, payback period, ROI, LCOE. Zero dependencies, function-level tree-shaking, runs in
the browser.

```sh
npm i @pvkit/economics
```

```ts
import { cashFlows, irr, npv, paybackPeriod } from "@pvkit/economics";

// 10,000 up front, 6,000 kWh/yr for 25 years valued at 0.25/kWh
const flows = cashFlows({ capitalCost: 10000, energy: Array(25).fill(6000), energyPrice: 0.25 });
console.log(paybackPeriod({ cashFlows: flows })); // 6.666666666666667 (years)
console.log(npv({ cashFlows: flows, discountRate: 0.05 }).toFixed(0), irr({ cashFlows: flows }).toFixed(3)); // 11141 0.145
```

> For broader context, see the [monorepo README](https://github.com/semanticist21/pvkit/blob/main/README.md).

## Methods

Every method is its own subpath (`@pvkit/economics/<method>`); the root entry re-exports all.

| Method | Computes | Reference |
| --- | --- | --- |
| `lifetime-energy` | yearly kWh with compound degradation + lifetime total | Jordan & Kurtz 2013, NREL SAM |
| `bill-savings` | self-consumption vs export, avoided cost + export revenue (flat or TOU prices) | NREL SAM net billing |
| `cash-flows` | year 0…n cash flows: capex, incentive, escalating energy value and O&M | Short et al. 1995 (NREL) |
| `npv` | net present value | numpy-financial |
| `irr` | internal rate of return (closest to 0 if several) | numpy-financial |
| `payback-period` | simple or discounted payback, fractional years | Short et al. 1995 |
| `roi` | simple return on investment | Short et al. 1995 |
| `lcoe` | levelized cost of energy | Short et al. 1995 |

Each has a theory note (`src/<method>/<method>.md`) whose Reference section names its
fixtures. `npv` and `irr` are checked against numpy-financial. The other six are checked against the
cited formula restated in Python (arithmetic); their conventions are checked against NREL SAM
(`lifetime-energy`, `bill-savings`, `lcoe`) or a hand-derived worked example (`cash-flows`,
`payback-period`, `roi`).

## Usage

Money is unitless (your currency); rates are fractions per year; energy is kWh.

```ts
import { billSavings, cashFlows, irr, lcoe, lifetimeEnergy, npv, paybackPeriod } from "@pvkit/economics";

// hourly PV and load for a typical year (kWh), e.g. from @pvkit/core energyKwh per hour
const year1 = billSavings({ production, load, importPrice: 0.3, exportPrice: 0.08 });
const pvKwh = year1.selfConsumption + year1.gridExport; // = ΣP, compensated

const energy = lifetimeEnergy({ firstYearEnergy: pvKwh, degradationRate: 0.005, years: 25 });
const flows = cashFlows({
  capitalCost: 12000,
  incentive: 3600,
  energy: energy.annual,
  energyPrice: year1.savings / pvKwh, // blended value per kWh
  priceEscalation: 0.02,
  omCost: 100,
});

npv({ cashFlows: flows, discountRate: 0.05 });
irr({ cashFlows: flows });
paybackPeriod({ cashFlows: flows }); // years
lcoe({ costs: [12000 - 3600, ...Array(25).fill(100)], energy: [0, ...energy.annual], discountRate: 0.05 });
```

Pre-tax and unlevered by design: `cashFlows` returns a plain array — add an inverter
replacement, taxes or loan payments by editing it before `npv` / `irr`.
