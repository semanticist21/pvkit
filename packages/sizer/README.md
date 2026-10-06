# @pvkit/sizer

Solar string sizing calculator: temperature-corrected module voltages, the NEC 690.7
maximum system voltage, and min/max modules per string plus parallel strings against an
inverter's DC ratings. Zero dependencies, ESM-only, one subpath per method.

```sh
npm i @pvkit/sizer
```

```ts
import { stringSize } from "@pvkit/sizer/string-size";
import { voltageAtTemperature } from "@pvkit/sizer/voltage-at-temperature";

const vocMax = voltageAtTemperature({ voltage: 49.5, beta: -0.135, tempCell: -10 }); // 54.225 V, coldest
const vmpMin = voltageAtTemperature({ voltage: 41.2, beta: -0.135, tempCell: 70 }); // 35.125 V, hottest
console.log(stringSize({ vocMax, vmpMin, imp: 13.1, vdcMax: 600, mpptLow: 200, idcMax: 30 }));
// { minSeries: 6, maxSeries: 11, maxParallel: 2 }
```

> For broader context and positioning, see the [monorepo README](https://github.com/semanticist21/pvkit/blob/main/README.md).

## Methods

| Subpath | Function | Spec |
| --- | --- | --- |
| `@pvkit/sizer/voltage-at-temperature` | `voltageAtTemperature` | NEC 690.7(A)(1) coefficient method |
| `@pvkit/sizer/nec-voltage-correction` | `necVoltageCorrection` | NEC Table 690.7(A) |
| `@pvkit/sizer/string-size` | `stringSize` | NEC 690.7(A), inverter DC ratings |

Field names match [`@pvkit/spec`](https://github.com/semanticist21/pvkit/tree/main/packages/spec) records, so library entries plug in directly:

```ts
import { CEC_INVERTERS } from "@pvkit/spec/cec-inverters";
import { CEC_MODULES } from "@pvkit/spec/cec-modules";
import { stringSize } from "@pvkit/sizer/string-size";
import { voltageAtTemperature } from "@pvkit/sizer/voltage-at-temperature";

const m = CEC_MODULES.find((x) => x.name === "Jinko Solar Co Ltd JKM200M-60B")!;
const inv = CEC_INVERTERS.find((x) => x.name === "SMA America: SB70-1SP-US-40 {240V}")!;

const vocMax = voltageAtTemperature({ voltage: m.voc, beta: m.betaOc, tempCell: -15 });
const vmpMin = voltageAtTemperature({ voltage: m.vmp, beta: m.betaOc, tempCell: 70 });
// CEC vdcMax/mpptLow are the rated MPPT window (480 V here), not the 600 V datasheet
// maximum input voltage: pass that as vdcMax for the NEC 690.7 limit.
stringSize({ ...inv, vdcMax: 600, vocMax, vmpMin, imp: m.imp }); // { minSeries, maxSeries, maxParallel }
```

`tempCell` for `vocMax` is the site's lowest expected ambient (e.g. ASHRAE extreme annual
mean minimum); for `vmpMin`, the hottest expected cell temperature. Without a coefficient,
`m.voc * necVoltageCorrection({ tempMin })` is the code's crystalline-silicon fallback.

## Correctness

Fixtures re-evaluate the NEC formulas and table in Python float64 (proving JS/Python
agreement and edge handling) and pin cited published worked examples where one exists; the
table rows are checked against a published reproduction. Per-method notes and sources:
`src/<method>/<method>.md`.
