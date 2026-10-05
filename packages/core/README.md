# @pvkit/core

PV (solar) performance modeling core. Zero dependencies, ESM-only,
function-level tree-shaking.

> For broader context and positioning, see the [monorepo README](https://github.com/semanticist21/pvkit/blob/main/README.md).

## Modules

Every method is its own subpath (`@pvkit/core/<module>/<method>`) — import only what you use.

| Module | Methods | Spec |
| --- | --- | --- |
| `solarposition` | `spa`, `sunrise-spa`, `sunrise-geometric`, `equation-of-time`, `declination`, `hour-angle`, `earth-sun-distance` | NREL SPA (Reda & Andreas 2004), Spencer 1971, Cooper 1969 |
| `atmosphere` | `relative-airmass`, `absolute-airmass`, `altitude-pressure`, `gueymard94-pw`, `angstrom`, `kasten96-lt`, `bird-hulstrom80-aod-bb` | Kasten & Young 1989, Gueymard 1994, … |
| `clearsky` | `haurwitz`, `ineichen`, `simplified-solis` | Ineichen & Perez 2002, Ineichen 2008 |
| `irradiance` | `aoi`, `extra-radiation`, `isotropic`, `klucher`, `hay-davies`, `reindl`, `perez`, `ground-diffuse`, `poa-components`, `total-irradiance` | Perez 1990, Hay & Davies 1980, … |
| `decomposition` | `clearness-index`, `complete-irradiance`, `erbs`, `boland`, `disc`, `dirint`, `dirindex` | Erbs 1982, Maxwell 1987 (DISC), Perez 1992 (DIRINT) |
| `iam` | `physical`, `ashrae`, `martin-ruiz`, `sapm`, `interp`, `marion` | De Soto 2006, Martin & Ruiz 2001, Marion 2017 |
| `temperature` | `sapm`, `pvsyst-cell`, `faiman`, `ross`, `noct-sam`, `fuentes`, `generic-linear`, `generic-linear-model` | King 2004 (SAPM), Faiman 2008, Fuentes 1987 |
| `tracking` | `singleaxis` (with backtracking), `calc-axis-tilt`, `calc-cross-axis-tilt` | Marion & Dobos 2013, Anderson & Mikofski 2020 |
| `pvsystem` | `pvwatts-dc`, `pvwatts-inverter`, `pvwatts-losses`, `scale-voltage-current-power`, `energy-kwh` | PVWatts v5 (Dobos 2014) |
| `losses` | `soiling-kimber`, `soiling-hsu`, `combine-loss-factors` | Kimber 2006, Coello & Boyle 2019 |
| `metrics` | `performance-ratio`, `specific-yield`, `capacity-factor`, `availability` | IEC 61724-1, Marion 2005 |

Each method has a theory note in the repository — `src/models/<module>/<method>/<method>.md` (equations, paper, tolerance): [browse](https://github.com/semanticist21/pvkit/tree/main/packages/core/src/models).

## Correctness

Implementations are written from the published literature. Every method is
checked against pvlib 0.16.1 outputs — or, where pvlib has no equivalent (metrics,
energy integration), an exactly-rounded Python reference — ≈6,700 fixture cases,
typically within 1e-9 or tighter; and an end-to-end test reproduces pvlib's sun-position → kWh
chain. Results are tolerance-equal across JS engines, not bit-identical.

## Unit safety

`units.ts` provides branded `Radians` / `Degrees` types. rad/deg mix-ups are
caught at compile time, with zero runtime cost (the brand is erased at build).

```ts
import { radians, toDegrees } from "@pvkit/core";

toDegrees(radians(Math.PI)); // 180
```

## Usage

Time is UTC epoch ms, angles are degrees, irradiance W/m². Modules never call each
other — you wire outputs to inputs:

```ts
import { relativeAirmass } from "@pvkit/core/atmosphere/relative-airmass";
import { ineichen } from "@pvkit/core/clearsky/ineichen";
import { totalIrradiance } from "@pvkit/core/irradiance/total-irradiance";
import { pvwattsDc } from "@pvkit/core/pvsystem/pvwatts-dc";
import { spa } from "@pvkit/core/solarposition/spa";
import { SAPM_TEMPERATURE_PARAMETERS, sapmCell } from "@pvkit/core/temperature/sapm";

const sun = spa({ timeMs: Date.UTC(2025, 5, 21, 3), latitude: 37.5665, longitude: 126.978 });
const am = relativeAirmass({ solarZenith: sun.apparentZenith }); // sea level: absolute = relative
const sky = ineichen({ apparentZenith: sun.apparentZenith, airmassAbsolute: am, linkeTurbidity: 3 });
const poa = totalIrradiance({
  surfaceTilt: 30, surfaceAzimuth: 180,
  solarZenith: sun.apparentZenith, solarAzimuth: sun.azimuth, ...sky,
});
const tempCell = sapmCell({
  poaGlobal: poa.poaGlobal, tempAir: 25, windSpeed: 1,
  ...SAPM_TEMPERATURE_PARAMETERS.openRackGlassGlass,
});
const watts = pvwattsDc({ effectiveIrradiance: poa.poaGlobal, tempCell, pdc0: 5000, gammaPdc: -0.004 });
```

Like pvlib, models return `NaN` where the math is undefined (e.g. Perez with
dni = dhi = 0 at low sun in measured data), and `energyKwh` does not skip it — map
`NaN` to 0 before summing if that is what you mean.

Full chain to kWh (Perez, inverter, energy sum): [`src/pipeline.test.ts`](https://github.com/semanticist21/pvkit/blob/main/packages/core/src/pipeline.test.ts).
Conventions (time, angles, azimuth origin, ΔT): [`doc/conventions.md`](https://github.com/semanticist21/pvkit/blob/main/doc/conventions.md).

## Development

```bash
pnpm install       # from the monorepo root
pnpm test          # this package (vitest run)
pnpm bench         # perf-critical methods (vitest bench)
pnpm build         # tsdown → dist (ESM + .d.ts + subpath exports)
```
