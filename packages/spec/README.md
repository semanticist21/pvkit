# @pvkit/spec

CEC solar module (PV panel) and inverter database plus Sandia SAPM module parameters from
NREL SAM, as typed, zero-dependency ESM data.

```sh
npm i @pvkit/spec
```

```ts
import { CEC_INVERTERS } from "@pvkit/spec/cec-inverters";

const inv = CEC_INVERTERS.find((i) => i.name === "SMA America: SB70-1SP-US-40 {240V}")!;
console.log(inv.paco, inv.vdcMax, inv.mpptLow, inv.mpptHigh); // 7000 480 245 480
```

Field names match the inputs of [`pvkit`](https://www.npmjs.com/package/pvkit)'s `diode` and
`sizer` modules, so a row spreads straight in (examples in its README).

> For broader context and positioning, see the [monorepo README](https://github.com/semanticist21/pvkit/blob/main/README.md).

## Libraries

Each library is its own subpath; a bundle carries only the data it imports.

| Subpath | Export | Rows | Size (gzip) | Contents |
| --- | --- | --- | --- | --- |
| `@pvkit/spec/cec-modules` | `CEC_MODULES` | 21,677 | ≈ 1.5 MB | datasheet STC ratings + CEC single-diode parameters |
| `@pvkit/spec/cec-inverters` | `CEC_INVERTERS` | 2,343 | ≈ 85 kB | Sandia inverter-model parameters + DC voltage/current limits |
| `@pvkit/spec/sandia-modules` | `SANDIA_MODULES` | 523 | ≈ 21 kB | SAPM coefficients |

The root entry `@pvkit/spec` exports only the record types (`CecModule`, `CecInverter`,
`SandiaModule`) — zero bytes at runtime.

```ts
// In a browser, load the large module list on demand:
const { CEC_MODULES } = await import("@pvkit/spec/cec-modules");
const m = CEC_MODULES.find((x) => x.name === "Jinko Solar Co Ltd JKM200M-60B");
```

Units are fixed per field and documented on each type (W, V, A, m², °C; `gammaPmp` in 1/°C
so it feeds `pvkit`'s `pvwattsDc` directly). Rows are as published, not curated.

## Source and correctness

Data: NREL System Advisor Model (SAM) release `2026.7.3.r0.ssc.308`, `deploy/libraries/`
(BSD-3-Clause; its notice ships in `LICENSE` beside pvkit's MIT). Every row is regenerated
by a committed script; sampled rows are checked against pvlib 0.16.1's independent
`retrieve_sam` parse of the same files. Per-library notes
(spec papers, quirks): `src/<library>/<library>.md`.
