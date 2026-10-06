# @pvkit/diode

Single-diode and SAPM PV electrical models in plain ESM: module parameters → full I-V
key points → inverter AC power, in the browser. Zero runtime dependencies, function-level
tree-shaking.

> For broader context, see the [monorepo README](https://github.com/semanticist21/pvkit/blob/main/README.md).

## Methods

Every method is its own subpath (`@pvkit/diode/<method>`); the root entry re-exports all.

| Method | Computes | Spec |
| --- | --- | --- |
| `calcparams-desoto` | single-diode parameters at irradiance + cell temperature | De Soto et al. 2006 |
| `calcparams-cec` | same, CEC six-parameter fit | Dobos 2012 |
| `calcparams-pvsyst` | same, PVsyst model | Sauer et al. 2015 |
| `single-diode` | Isc, Voc, Imp, Vmp, Pmp, Ix, Ixx | Jain & Kapoor 2004, Bishop 1988 |
| `i-from-v`, `v-from-i` | any point on the I-V curve, exact (Lambert W) | Jain & Kapoor 2004 |
| `sapm` | SAPM I-V key points | King et al. 2004 |
| `sapm-spectral-factor`, `sapm-effective-irradiance` | SAPM F1 and effective irradiance | King et al. 2004 |
| `inverter-sandia` | AC power, Sandia inverter model | King et al. 2007 |
| `inverter-adr` | AC power, ADR inverter model | Driesse et al. 2008 |

Each has a theory note (`src/<method>/<method>.md`) and is checked against pvlib 0.16.1 on
≈3,400 fixture cases built from the SAM module and inverter libraries (typically 1e-15).

## Usage

Parameter names match [`@pvkit/spec`](https://github.com/semanticist21/pvkit/tree/main/packages/spec) records, so a library row spreads straight in:

```ts
import { calcparamsCec, inverterSandia, singleDiode } from "@pvkit/diode";
import { CEC_INVERTERS } from "@pvkit/spec/cec-inverters";
import { CEC_MODULES } from "@pvkit/spec/cec-modules";

const module = CEC_MODULES.find((m) => m.name === "CSI Solar Co Ltd CS6P-200P")!;
const params = calcparamsCec({ ...module, effectiveIrradiance: 850, tempCell: 47 });
const { pMp, vMp } = singleDiode(params); // W, V for one module

const inverter = CEC_INVERTERS[0]!;
inverterSandia({ ...inverter, vdc: vMp * 12, pdc: pMp * 12 }); // 12-module string, W AC
```

Effective irradiance and cell temperature come from `@pvkit/core` (`irradiance`, `iam`,
`temperature`). Scalar in, scalar out — one instant per call.
