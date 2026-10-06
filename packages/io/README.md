# @pvkit/io

PVGIS TMY and NASA POWER client for JavaScript — fetch solar irradiance (GHI, DNI, DHI) and
weather for PV modeling. Zero dependencies, ESM-only, runs in the browser. Responses are
parsed exactly like pvlib's `iotools` (validated against pvlib 0.16.1 on captured responses)
into plain records with pvkit field names and units.

```sh
npm i @pvkit/io
```

```ts
import { getNasaPower } from "@pvkit/io/nasa-power";

const { data } = await getNasaPower({
  latitude: 37.57, longitude: 126.98,
  startMs: Date.UTC(2024, 5, 1), endMs: Date.UTC(2024, 5, 1),
  parameters: ["ghi", "tempAir"],
});
console.log(data.length, data[4]); // 24 { timeMs: 1717214400000, ghi: 936.3, tempAir: 22.7 }
// data[i] = { timeMs, ...requested parameters } — feed @pvkit/core per hour
```

> For broader context, see the [monorepo README](https://github.com/semanticist21/pvkit/blob/main/README.md).

| Subpath | Source | Browser |
| --- | --- | --- |
| `@pvkit/io/pvgis-tmy` | PVGIS typical meteorological year (8760 h, global) | needs a proxy — PVGIS sends no CORS headers; pass `url` |
| `@pvkit/io/nasa-power` | NASA POWER hourly (satellite + MERRA-2, global, 2001→) | direct |

Units: time UTC epoch ms (interval start), irradiance W/m², temperature °C, wind m/s,
pressure Pa, humidity %. Missing values are `NaN`. PVGIS irradiance is centred
`meta.irradianceTimeOffset` hours (0.5) after `timeMs`. Every getter takes `fetch` (inject a
custom/mock fetch) and `signal` (abort). Method notes: `src/<method>/<method>.md`.
