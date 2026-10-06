# @pvkit/sizer

PV string sizing: temperature-corrected module voltages, the NEC 690.7 maximum system
voltage, and series/parallel limits against an inverter's DC ratings. Zero dependencies,
ESM-only, one subpath per method.

> For broader context and positioning, see the [monorepo README](https://github.com/semanticist21/pvkit/blob/main/README.md).

## Methods

| Subpath | Function | Spec |
| --- | --- | --- |
| `@pvkit/sizer/voltage-at-temperature` | `voltageAtTemperature` | NEC 690.7(A)(1) coefficient method |
| `@pvkit/sizer/nec-voltage-correction` | `necVoltageCorrection` | NEC Table 690.7(A) |
| `@pvkit/sizer/string-size` | `stringSize` | NEC 690.7(A), inverter DC ratings |

Field names match [`@pvkit/spec`](../spec) records, so library entries plug in directly:

```ts
import { CEC_INVERTERS } from "@pvkit/spec/cec-inverters";
import { CEC_MODULES } from "@pvkit/spec/cec-modules";
import { stringSize } from "@pvkit/sizer/string-size";
import { voltageAtTemperature } from "@pvkit/sizer/voltage-at-temperature";

const m = CEC_MODULES.find((x) => x.name === "Jinko Solar Co Ltd JKM200M-60B")!;
const inv = CEC_INVERTERS.find((x) => x.name === "SMA America: SB70-1SP-US-40 {240V}")!;

const vocMax = voltageAtTemperature({ voltage: m.voc, beta: m.betaOc, tempCell: -15 });
const vmpMin = voltageAtTemperature({ voltage: m.vmp, beta: m.betaOc, tempCell: 70 });
stringSize({ ...inv, vocMax, vmpMin, imp: m.imp }); // { minSeries, maxSeries, maxParallel }
```

`tempCell` for `vocMax` is the site's lowest expected ambient (e.g. ASHRAE extreme annual
mean minimum); for `vmpMin`, the hottest expected cell temperature. Without a coefficient,
`m.voc * necVoltageCorrection(tempMin)` is the code's crystalline-silicon fallback.

## Correctness

Every method is checked against an independent Python float64 evaluation of the NEC
formulas and table (164 fixture cases). Per-method notes: `src/<method>/<method>.md`.
