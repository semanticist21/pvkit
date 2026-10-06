# pvkit

PV (solar) performance modeling in TypeScript: NREL SPA sun position, clear-sky and
plane-of-array irradiance, cell temperature, tracking, PVWatts DC/AC and kWh, single-diode I-V,
row spacing and shading, string sizing, PVGIS / NASA POWER weather, a ModelChain and solar
ROI/LCOE. It runs wherever JavaScript runs (browser, edge, Workers, Node, React Native), with
zero dependencies, ESM-only, and one subpath per method. Every model is checked against pvlib or
another independent reference.

```sh
npm i pvkit
npm i @pvkit/spec   # optional: CEC / Sandia module and inverter databases (multi-MB data)
```

## Quickstart: kWh in a few lines

```ts
import { modelChain } from "pvkit/chain/model-chain";
import { energyKwh } from "pvkit/pvsystem/energy-kwh";

// 5 kW, 30° tilt, facing south, Seoul, 21 June 2025 (local day), 15-minute steps
const site = { latitude: 37.5665, longitude: 126.978, surfaceTilt: 30, surfaceAzimuth: 180,
  pdc0: 5000, gammaPdc: -0.004, linkeTurbidity: 3 };
const pac = [];
for (let t = Date.UTC(2025, 5, 20, 15); t < Date.UTC(2025, 5, 21, 15); t += 15 * 60_000) {
  pac.push(modelChain({ ...site, timeMs: t }).pac);
}
console.log(energyKwh({ power: pac, stepHours: 0.25 })); // 28.22864450658671 kWh
```

`linkeTurbidity` runs the chain on modeled **clear sky**, so that figure is a cloudless upper
bound, not a yield estimate. For a real estimate pass measured or typical-year weather instead,
for example from `pvkit/io` (below):

```ts
import { modelChain } from "pvkit/chain/model-chain";

const out = modelChain({
  timeMs: Date.UTC(2025, 5, 21, 3), latitude: 37.5665, longitude: 126.978,
  surfaceTilt: 30, surfaceAzimuth: 180, pdc0: 5000, gammaPdc: -0.004,
  weather: { ghi: 850, dni: 700, dhi: 150 }, tempAir: 28, windSpeed: 2,
});
console.log(Math.round(out.pac)); // 3024 (W AC for this one instant)
```

Optional `modelChain` inputs: `albedo`, `transposition`, `losses`, `temperatureModel`,
`inverterPdc0`, `etaInvNom`, `deltaT`.

> Live demo: <https://pvkit.netlify.app>, a browser-only clear-sky kWh estimate built on this
> package. Repository: <https://github.com/semanticist21/pvkit>.

## No build step

Every subpath is plain ESM, so a CDN import works in a bare HTML page:

```html
<script type="module">
  import { spa } from "https://esm.sh/pvkit@0.2/solarposition/spa";

  const sun = spa({ timeMs: Date.now(), latitude: 37.5665, longitude: 126.978 });
  console.log(sun.apparentElevation, sun.azimuth); // degrees
</script>
```

## Modules

Every method is its own subpath, `pvkit/<module>/<method>`, so you import only what you use.
`pvkit/<module>` re-exports all of a module's methods. The root `pvkit` exports only the unit
helpers (also at `pvkit/units`).

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
| `diode` | `calcparams-desoto`, `calcparams-cec`, `calcparams-pvsyst`, `single-diode`, `i-from-v`, `v-from-i`, `sapm`, `sapm-spectral-factor`, `sapm-effective-irradiance`, `inverter-sandia`, `inverter-adr` | De Soto 2006, Dobos 2012, Sauer 2015, Jain & Kapoor 2004, King 2004 / 2007, Driesse 2008 |
| `layout` | `roof-fit`, `min-pitch`, `shaded-fraction1d`, `projected-solar-zenith-angle`, `masking-angle`, `masking-angle-passias`, `sky-diffuse-passias`, `ground-angle`, `direct-martinez`, `horizon` | Anderson & Jensen 2024, Passias & Källbäck 1984, Martínez-Moreno 2010 |
| `sizer` | `voltage-at-temperature`, `nec-voltage-correction`, `string-size` | NEC 690.7, inverter DC ratings |
| `economics` | `lifetime-energy`, `bill-savings`, `cash-flows`, `npv`, `irr`, `payback-period`, `roi`, `lcoe` | Short et al. 1995 (NREL), Jordan & Kurtz 2013, NREL SAM |
| `io` | `pvgis-tmy`, `nasa-power` | PVGIS and NASA POWER APIs, parsed as pvlib `iotools` |
| `chain` | `model-chain` | pvlib `ModelChain` (PVWatts model set) |

Each method has a theory note with its equations, paper and tolerance at
`src/models/<module>/<method>/<method>.md`:
[browse](https://github.com/semanticist21/pvkit/tree/main/packages/pvkit/src/models).

## Why trust it

Models are written from the published papers. Their outputs are then pinned as fixtures from an
independent reference and asserted in tests:

| Module | Fixture cases | Reference |
| --- | ---: | --- |
| `solarposition` | 646 | pvlib 0.16.1 |
| `atmosphere` | 618 | pvlib 0.16.1 |
| `clearsky` | 361 | pvlib 0.16.1 |
| `irradiance` | 1,453 | pvlib 0.16.1 |
| `decomposition` | 809 | pvlib 0.16.1 |
| `iam` | 523 | pvlib 0.16.1 |
| `temperature` | 958 | pvlib 0.16.1 |
| `tracking` | 354 | pvlib 0.16.1 |
| `pvsystem` | 412 | pvlib 0.16.1; exactly-rounded Python for energy integration |
| `losses` | 74 | pvlib 0.16.1 |
| `metrics` | 287 | exactly-rounded Python (pvlib has no equivalent) |
| `diode` | 3,419 | pvlib 0.16.1 on NREL SAM module and inverter libraries |
| `layout` | 3,378 | `pvlib.shading` 0.16.1; hand counts and root checks where no library exists |
| `sizer` | 168 | NEC 690.7 formulas in Python float64, plus published worked examples |
| `economics` | 511 | numpy-financial (NPV, IRR); cited formulas, conventions checked against NREL SAM |
| `io` | 4 | pvlib 0.16.1 `iotools` on captured responses |
| `chain` | 3 sites, 168 steps | pvlib `ModelChain` 0.16.1 |
| end-to-end pipeline | 288 | pvlib sun position → kWh chain |

Typical agreement is 1e-9 relative or tighter. Results are tolerance-equal across JS engines,
not bit-identical. The counts are the records in each `src/**/*-fixtures.json` (the root array,
or else each top-level case array; input arrays such as the horizon `profile` are excluded).

## Usage

Time is UTC epoch ms (`timeMs`), angles are degrees, irradiance W/m², power W. One instant per
call: loop for a series. Modules never call each other (except `chain`), so you wire outputs
to inputs:

```ts
import { relativeAirmass } from "pvkit/atmosphere/relative-airmass";
import { ineichen } from "pvkit/clearsky/ineichen";
import { totalIrradiance } from "pvkit/irradiance/total-irradiance";
import { pvwattsDc } from "pvkit/pvsystem/pvwatts-dc";
import { spa } from "pvkit/solarposition/spa";
import { SAPM_TEMPERATURE_PARAMETERS, sapmCell } from "pvkit/temperature/sapm";

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
console.log(watts.toFixed(0)); // 4389 (W DC)
```

Like pvlib, models return `NaN` where the math is undefined (for example Perez with
dni = dhi = 0 at low sun in measured data), and `energyKwh` does not skip it. Map `NaN` to 0
before summing if that is what you mean.

### Sun position and sunrise

```ts
import { spa } from "pvkit/solarposition/spa";
import { sunriseSpa } from "pvkit/solarposition/sunrise-spa";

const seoul = { latitude: 37.5665, longitude: 126.978 };
const sun = spa({ ...seoul, timeMs: Date.UTC(2025, 5, 21, 3) }); // 12:00 KST
console.log(sun.azimuth.toFixed(1), sun.apparentElevation.toFixed(1)); // 150.4 74.1
const { sunrise, sunset } = sunriseSpa({ ...seoul, timeMs: Date.UTC(2025, 5, 21) });
console.log(new Date(sunrise).toISOString(), new Date(sunset).toISOString());
// 2025-06-20T20:11:13.852Z 2025-06-21T10:56:43.842Z  (05:11 / 19:56 KST)
```

### Single-diode I-V with library parameters

Input names match the [`@pvkit/spec`](https://www.npmjs.com/package/@pvkit/spec) records, so a
library row spreads straight in:

```ts
import { CEC_INVERTERS } from "@pvkit/spec/cec-inverters";
import { CEC_MODULES } from "@pvkit/spec/cec-modules";
import { calcparamsCec } from "pvkit/diode/calcparams-cec";
import { inverterSandia } from "pvkit/diode/inverter-sandia";
import { singleDiode } from "pvkit/diode/single-diode";

const module = CEC_MODULES.find((m) => m.name === "CSI Solar Co Ltd CS6P-200P")!;
const stc = singleDiode(calcparamsCec({ ...module, effectiveIrradiance: 1000, tempCell: 25 }));
console.log(stc.pMp.toFixed(1), stc.vMp.toFixed(1)); // 200.3 28.9 (a 200 W module at STC)

const { pMp, vMp } = singleDiode(calcparamsCec({ ...module, effectiveIrradiance: 850, tempCell: 47 }));
const inverter = CEC_INVERTERS.find((i) => i.name === "SMA America: SB70-1SP-US-40 {240V}")!;
console.log(inverterSandia({ ...inverter, vdc: vMp * 12, pdc: pMp * 12 }).toFixed(0)); // 1811 W AC
```

### String sizing

```ts
import { stringSize } from "pvkit/sizer/string-size";
import { voltageAtTemperature } from "pvkit/sizer/voltage-at-temperature";

const vocMax = voltageAtTemperature({ voltage: 49.5, beta: -0.135, tempCell: -10 }); // 54.225 V, coldest
const vmpMin = voltageAtTemperature({ voltage: 41.2, beta: -0.135, tempCell: 70 }); // 35.125 V, hottest
console.log(stringSize({ vocMax, vmpMin, imp: 13.1, vdcMax: 600, mpptLow: 200, idcMax: 30 }));
// { minSeries: 6, maxSeries: 11, maxParallel: 2 }
```

`tempCell` for `vocMax` is the site's lowest expected ambient; for `vmpMin`, the hottest
expected cell temperature. Field names match `@pvkit/spec`. CEC `vdcMax` is the rated MPPT
window, so pass the datasheet maximum input voltage as `vdcMax` for the NEC 690.7 limit.

### Roof fit and row spacing

```ts
import { minPitch } from "pvkit/layout/min-pitch";
import { roofFit } from "pvkit/layout/roof-fit";

console.log(roofFit({ roofWidth: 10, roofHeight: 5, moduleLength: 1.7, moduleWidth: 1.1, setback: 0.5 }).count); // 16
// winter-solstice noon in Seoul: sun elevation ≈ 29°
console.log(minPitch({ collectorWidth: 2.2, surfaceTilt: 30, surfaceAzimuth: 180, solarZenith: 61, solarAzimuth: 180 }));
// 3.889708419124331
```

Lengths are in any consistent unit, except `roofFit`, which works in metres (its default `gap`
is 0.02 m).

### Payback, NPV, IRR

```ts
import { cashFlows, irr, npv, paybackPeriod } from "pvkit/economics";

// 10,000 up front, 6,000 kWh/yr for 25 years valued at 0.25/kWh
const flows = cashFlows({ capitalCost: 10000, energy: Array(25).fill(6000), energyPrice: 0.25 });
console.log(paybackPeriod({ cashFlows: flows })); // 6.666666666666667 (years)
console.log(npv({ cashFlows: flows, discountRate: 0.05 }).toFixed(0), irr({ cashFlows: flows }).toFixed(3)); // 11141 0.145
```

Money is unitless (your currency), rates are fractions per year, energy is kWh. Pre-tax and
unlevered: `cashFlows` returns a plain array, so add taxes, loans or an inverter replacement by
editing it before `npv` / `irr`.

### Weather data

```ts
import { getNasaPower } from "pvkit/io/nasa-power";

const { data } = await getNasaPower({
  latitude: 37.57, longitude: 126.98,
  startMs: Date.UTC(2024, 5, 1), endMs: Date.UTC(2024, 5, 1),
  parameters: ["ghi", "tempAir"],
});
console.log(data.length, data[4]); // 24 { timeMs: 1717214400000, ghi: 936.3, tempAir: 22.7 }
```

| Subpath | Source | Browser |
| --- | --- | --- |
| `pvkit/io/pvgis-tmy` | PVGIS typical meteorological year (8760 h, global) | needs a proxy (PVGIS sends no CORS headers); pass `url` |
| `pvkit/io/nasa-power` | NASA POWER hourly (satellite + MERRA-2, global, 2001 on) | direct |

Times are the interval start; missing values are `NaN`. Every getter takes `fetch` (inject a
custom or mock fetch) and `signal` (abort).

## Unit safety

`Radians` / `Degrees` are branded types, so rad/deg mix-ups fail at compile time with zero
runtime cost (the brand is erased at build). Inputs stay plain numbers; returned angles carry
the brand.

```ts
import { radians, toDegrees } from "pvkit";

console.log(toDegrees(radians(Math.PI))); // 180
```

TypeScript consumers need `moduleResolution: "bundler"` (or `node16` and later) to resolve the
subpath types. Conventions for time, angles, azimuth origin and ΔT:
[`doc/conventions.md`](https://github.com/semanticist21/pvkit/blob/main/doc/conventions.md).

## Development

```bash
pnpm install       # from the monorepo root
pnpm test          # this package (vitest run)
pnpm bench         # perf-critical methods (vitest bench)
pnpm build         # tsdown → dist (ESM + .d.ts + subpath exports)
```

MIT licensed.
