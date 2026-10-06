# @pvkit/layout

PV array layout and row-to-row shading — zero dependencies, ESM-only, function-level
subpaths. Shading models are validated against `pvlib.shading` 0.16.1.

| Subpath | What |
| --- | --- |
| `roof-fit` | Modules that fit a rectangular roof (setback, gaps, portrait/landscape) + rectangles to draw |
| `min-pitch` | Smallest row pitch with no beam shade at a design sun |
| `shaded-fraction1d` | Shaded fraction of a fixed or tracked row (Anderson & Jensen 2024) |
| `projected-solar-zenith-angle` | Sun zenith projected on a row's cross-section |
| `masking-angle`, `masking-angle-passias`, `sky-diffuse-passias` | Sky-diffuse lost to the row in front (Passias & Källbäck 1984) |
| `ground-angle` | Ground visible from a point on the row slant |
| `direct-martinez` | Power loss from partial shade with bypass diodes (Martínez-Moreno 2010) |
| `horizon` | Horizon-profile elevation at an azimuth (block beam below it) |

```ts
import { minPitch } from "@pvkit/layout/min-pitch";
import { roofFit } from "@pvkit/layout/roof-fit";

roofFit({ roofWidth: 10, roofHeight: 5, moduleLength: 1.7, moduleWidth: 1.1, setback: 0.5 }).count; // 16
// winter-solstice noon in Seoul: sun elevation ≈ 29°
minPitch({ collectorWidth: 2.2, surfaceTilt: 30, surfaceAzimuth: 180, solarZenith: 61, solarAzimuth: 180 });
```

Angles are degrees, azimuths from north clockwise (as `@pvkit/core`). Lengths are in any
unit, consistently. Method notes with equations: `src/<method>/<method>.md`.
