# pvkit

PV (solar) performance modeling in TypeScript — sun position, irradiance, cell temperature,
DC/AC power and kWh — that runs wherever JavaScript runs: browser, edge, Workers, React Native.
Zero runtime dependencies, ESM-only, every model checked against reference implementations.

**Live demo:** [pvkit.netlify.app](https://pvkit.netlify.app) — a browser-only clear-sky kWh
estimate on `@pvkit/core`, no backend.

## Install

```bash
npm i @pvkit/core @pvkit/chain
```

## Quickstart: kWh in a few lines

```ts
import { modelChain } from "@pvkit/chain/model-chain";
import { energyKwh } from "@pvkit/core/pvsystem/energy-kwh";

// 5 kW, 30° tilt, facing south, Seoul, 21 June 2025 (local day), 15-minute steps
const site = { latitude: 37.5665, longitude: 126.978, surfaceTilt: 30, surfaceAzimuth: 180,
  pdc0: 5000, gammaPdc: -0.004, linkeTurbidity: 3 };
const pac = [];
for (let t = Date.UTC(2025, 5, 20, 15); t < Date.UTC(2025, 5, 21, 15); t += 15 * 60_000) {
  pac.push(modelChain({ ...site, timeMs: t }).pac);
}
console.log(energyKwh({ power: pac, stepHours: 0.25 })); // ≈ 28.2 kWh
```

`linkeTurbidity` runs the chain on modeled **clear sky**, so that figure is a cloudless upper
bound, not a yield estimate. For a real estimate pass measured or typical-year weather
(`weather: { ghi, dni, dhi }`, e.g. from [`@pvkit/io`](packages/io)) — see
[`@pvkit/chain`](packages/chain).

## No build step

Every subpath is plain ESM, so a CDN import works in a bare HTML page:

```html
<script type="module">
  import { spa } from "https://esm.sh/@pvkit/core@0.1/solarposition/spa";

  const sun = spa({ timeMs: Date.now(), latitude: 37.5665, longitude: 126.978 });
  console.log(sun.apparentElevation, sun.azimuth); // degrees
</script>
```

## Packages

| Package | npm | What |
| --- | --- | --- |
| [`@pvkit/core`](packages/core) | [![npm](https://img.shields.io/npm/v/@pvkit/core)](https://www.npmjs.com/package/@pvkit/core) | Sun position → irradiance → temperature → DC/AC → kWh (11 modules) |
| [`@pvkit/chain`](packages/chain) | [![npm](https://img.shields.io/npm/v/@pvkit/chain)](https://www.npmjs.com/package/@pvkit/chain) | Site + system + weather → AC power in one call (PVWatts model set) |
| [`@pvkit/io`](packages/io) | [![npm](https://img.shields.io/npm/v/@pvkit/io)](https://www.npmjs.com/package/@pvkit/io) | PVGIS TMY and NASA POWER hourly weather fetch |
| [`@pvkit/spec`](packages/spec) | [![npm](https://img.shields.io/npm/v/@pvkit/spec)](https://www.npmjs.com/package/@pvkit/spec) | CEC module/inverter and Sandia SAPM module databases (NREL SAM) |
| [`@pvkit/diode`](packages/diode) | [![npm](https://img.shields.io/npm/v/@pvkit/diode)](https://www.npmjs.com/package/@pvkit/diode) | Single-diode (De Soto/CEC/PVsyst) and SAPM electrical models, Sandia/ADR inverters |
| [`@pvkit/sizer`](packages/sizer) | [![npm](https://img.shields.io/npm/v/@pvkit/sizer)](https://www.npmjs.com/package/@pvkit/sizer) | String sizing — temperature-corrected Voc/Vmp, NEC 690.7, per-inverter limits |
| [`@pvkit/layout`](packages/layout) | [![npm](https://img.shields.io/npm/v/@pvkit/layout)](https://www.npmjs.com/package/@pvkit/layout) | Roof fit, row spacing, row-to-row shading, sky masking, horizon profiles |
| [`@pvkit/economics`](packages/economics) | [![npm](https://img.shields.io/npm/v/@pvkit/economics)](https://www.npmjs.com/package/@pvkit/economics) | Lifetime kWh with degradation, bill savings, NPV, IRR, payback, ROI, LCOE |

Each package README lists its methods and usage.

## Why trust it

Models are written from the published papers (NREL SPA, Perez, Hay-Davies, SAPM, PVWatts, …),
then their outputs are pinned as fixtures from an independent reference and asserted in tests:

| Package | Fixture cases | Reference |
| --- | ---: | --- |
| core | 6,783 | pvlib 0.16.1; exactly-rounded Python where pvlib has no equivalent |
| diode | 3,419 | pvlib 0.16.1 on NREL SAM module/inverter libraries |
| layout | 3,378 | `pvlib.shading` 0.16.1 |
| economics | 511 | numpy-financial (NPV, IRR); cited formulas, conventions checked against NREL SAM |
| sizer | 168 | NEC 690.7 formulas in Python float64 + published worked examples |
| spec | 131 | pvlib 0.16.1 `retrieve_sam` parse of the same SAM 2026.7.3 files |
| io | 4 | pvlib 0.16.1 `iotools` on captured responses |
| chain | 3 sites, 168 steps | pvlib `ModelChain` 0.16.1 |

Typical agreement is 1e-9 relative or tighter; results are tolerance-equal across JS engines,
not bit-identical. Counted as the records in each tracked `packages/*/src/**/*-fixtures.json`
(the root array, else each top-level case array; input arrays such as the horizon `profile` are
excluded); `pnpm fixtures` regenerates them all.

## Design

- **Runs anywhere.** Pure TypeScript, no backend round-trip, no WASM. SPA ≈ 18 µs/call.
- **Small bundles.** One subpath per method, `"sideEffects": false` — import only what you use.
- **Unit-safe.** Branded `Radians`/`Degrees` types catch rad/deg mix-ups at compile time, at
  zero runtime cost.
- **One instant per call.** Scalar in/out with `timeMs` (UTC epoch ms) — fits realtime and
  streaming; loop for a series.

## Development

```bash
pnpm install
pnpm build
pnpm test
```

MIT licensed; `@pvkit/spec` also ships NREL SAM data under BSD-3-Clause.
