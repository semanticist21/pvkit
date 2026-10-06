# @pvkit/io

Fetch irradiance and weather for PV modeling — zero dependencies, ESM-only, runs in the
browser. Responses are parsed exactly like pvlib's `iotools` (validated against pvlib 0.16.1
on captured responses) into plain records with pvkit field names and units.

| Subpath | Source | Browser |
| --- | --- | --- |
| `@pvkit/io/pvgis-tmy` | PVGIS typical meteorological year (8760 h, global) | needs a proxy — PVGIS sends no CORS headers; pass `url` |
| `@pvkit/io/nasa-power` | NASA POWER hourly (satellite + MERRA-2, global, 2001→) | direct |

```ts
import { getNasaPower } from "@pvkit/io/nasa-power";

const { data } = await getNasaPower({
  latitude: 37.57, longitude: 126.98,
  startMs: Date.UTC(2024, 0, 1), endMs: Date.UTC(2024, 11, 31),
  parameters: ["ghi", "dni", "dhi", "tempAir", "windSpeed"],
});
// data[i] = { timeMs, ghi, dni, dhi, tempAir, windSpeed } — feed @pvkit/core per hour
```

Units: time UTC epoch ms (interval start), irradiance W/m², temperature °C, wind m/s,
pressure Pa, humidity %. Missing values are `NaN`. Every getter takes `fetch` (inject a
custom/mock fetch) and `signal` (abort). Method notes: `src/<method>/<method>.md`.
