# pvkit

PV (solar) performance modeling in TypeScript (sun position, irradiance, cell temperature,
DC/AC power and kWh, single-diode I-V, shading, string sizing, weather data, project
economics and the CEC module/inverter database) that runs wherever JavaScript runs: browser,
edge, Workers, React Native. Zero runtime dependencies, ESM-only, and every model is checked
against reference implementations.

**Live demo:** [pvkit.netlify.app](https://pvkit.netlify.app), a browser-only clear-sky kWh
estimate built on `pvkit-js`, no backend.

```bash
npm i pvkit-js
```

Install, quickstart, the module list and the fixture counts behind each module are in the
package README: **[packages/pvkit](packages/pvkit)**.

## Packages

| Package | npm | What |
| --- | --- | --- |
| [`pvkit-js`](packages/pvkit) | [![npm](https://img.shields.io/npm/v/pvkit-js)](https://www.npmjs.com/package/pvkit-js) | Everything in 18 modules: sun position → irradiance → temperature → DC/AC → kWh, plus diode, layout, sizer, economics, io, chain and spec (CEC module/inverter and Sandia SAPM databases from NREL SAM; a bundle carries the data only when it imports it) |

[`apps/demo`](apps/demo) is the demo site (not published to npm).

## Design

- **Runs anywhere.** Pure TypeScript, no backend round-trip, no WASM. SPA ≈ 18 µs/call.
- **Small bundles.** One subpath per method (`pvkit-js/solarposition/spa`) and
  `"sideEffects": false`, so a bundle carries only what it imports.
- **Unit-safe.** Branded `Radians`/`Degrees` types catch rad/deg mix-ups at compile time, at
  zero runtime cost.
- **One instant per call.** Scalar in/out with `timeMs` (UTC epoch ms), which fits realtime and
  streaming use; loop for a series.
- **Validated.** Each model is written from its paper, then its outputs are pinned as fixtures
  from pvlib or another independent reference; `pnpm fixtures` regenerates them all.

## Development

```bash
pnpm install
pnpm build
pnpm test
```

MIT licensed; the `spec` module's NREL SAM data ships under BSD-3-Clause.
