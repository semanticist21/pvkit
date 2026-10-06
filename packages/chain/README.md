# @pvkit/chain

Solar PV output in one call — pvlib's `ModelChain` (PVWatts model set) in TypeScript/JavaScript:
site, system and weather in, AC power out. Built on [`@pvkit/core`](https://github.com/semanticist21/pvkit/tree/main/packages/core)
(its only dependency), ESM-only, runs in the browser.

```sh
npm i @pvkit/chain @pvkit/core
```

```ts
import { modelChain } from "@pvkit/chain/model-chain";

const out = modelChain({
  timeMs: Date.UTC(2025, 5, 21, 3), latitude: 37.5665, longitude: 126.978,
  surfaceTilt: 30, surfaceAzimuth: 180, pdc0: 5000, gammaPdc: -0.004,
  weather: { ghi: 850, dni: 700, dhi: 150 }, tempAir: 28, windSpeed: 2,
});
console.log(Math.round(out.pac)); // 3024 (W AC for this one instant)
```

> For broader context, see the [monorepo README](https://github.com/semanticist21/pvkit/blob/main/README.md).

## Methods

| Method | Computes | Reference |
| --- | --- | --- |
| `model-chain` | sun → air mass → (clear sky) → POA → IAM → cell temp → PVWatts DC → losses → AC | pvlib `ModelChain` 0.16.1 |

Checked against pvlib's own `ModelChain` on 168 steps (three sites), within 1e-9.
Theory: `src/model-chain/model-chain.md`.

## Usage

Time is UTC epoch ms, angles degrees, irradiance W/m², power W. One instant per call —
loop over your timestamps, then integrate with core's `energyKwh`:

```ts
import { modelChain } from "@pvkit/chain/model-chain";
import { energyKwh } from "@pvkit/core/pvsystem/energy-kwh";

const system = { latitude: 37.5665, longitude: 126.978, surfaceTilt: 30, surfaceAzimuth: 180,
  pdc0: 5000, gammaPdc: -0.004 };
const stepMs = 15 * 60_000;
const pac = [];
for (let t = Date.UTC(2025, 5, 20); t < Date.UTC(2025, 5, 21); t += stepMs) {
  pac.push(modelChain({ ...system, timeMs: t, linkeTurbidity: 3 }).pac); // clear sky
}
energyKwh({ power: pac, stepHours: 0.25 }); // kWh for the day
```

Pass `weather: { ghi, dni, dhi }` instead of `linkeTurbidity` for measured data, with
`tempAir` and `windSpeed` as top-level inputs (not inside `weather`). Optional: `albedo`,
`transposition`, `losses`, `temperatureModel`, `inverterPdc0`, `etaInvNom`, `deltaT`.
