# perez — Perez anisotropic sky diffuse

## Principle

Sky clearness `ε = ((dhi + dni)/dhi + κz³)/(1 + κz³)` (z in radians, κ = 1.041) selects one
of 8 bins with lower edges 1, 1.065, 1.23, 1.5, 1.95, 2.8, 4.5, 6.2; brightness
`Δ = dhi · airmassRelative / dniExtra`. Per bin, `F1 = max(f11 + f12Δ + f13z, 0)`,
`F2 = f21 + f22Δ + f23z`, and with `a = max(cos θ, 0)`, `b = max(cos z, cos 85°)`:

`poaSkyDiffuse = max(dhi · [(1 − F1)(1 + cos β)/2 + F1·a/b + F2·sin β], 0)`.

Coefficient sets (`perez-coefficients.ts`, all 11 sets from pvlib, generated): default
`allsitescomposite1990`, plus the 1988 composites and site sets.

Guards, as pvlib: `airmassRelative` NaN (sun below horizon) → 0. Binning follows
`np.digitize` with a leading edge 0: ε < 0 (negative dhi) or NaN (dhi = dni = 0) → NaN;
dhi = 0 with dni > 0 gives ε = ∞ → bin 8 and a 0 result. `airmassRelative` is a caller
input (pvlib `get_total_irradiance` would compute it). Unknown model → RangeError.
`return_components` is not exposed.

## Reference

- **Spec:** R. Perez, P. Ineichen, R. Seals, J. Michalsky, R. Stewart, "Modeling daylight
  availability and irradiance components from direct and global irradiance",
  *Solar Energy* 44(5):271–289, 1990, doi:10.1016/0038-092X(90)90055-H; R. Perez et al.,
  "The development and verification of the Perez diffuse radiation model", SAND88-7030,
  1988, doi:10.2172/7024029.
- **Reference implementation:** `pvlib.irradiance.perez(..., airmass, model)` @ pvlib 0.16.1,
  airmass from `pvlib.atmosphere.get_relative_airmass(zenith, "kastenyoung1989")`.
- **Fixtures:** `perez-fixtures.json` — the shared transposition scenario set (see
  `../irradiance.md`), coefficient set rotating over all 11.
- **Tolerance:** `1e-12` relative to `max(1, |expected|)` W/m². Observed max error: 1.9e-16 (relative; non-finite outcomes match exactly).
