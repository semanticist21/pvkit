# hay-davies — Hay & Davies circumsolar + isotropic sky diffuse

## Principle

Anisotropy index `AI = dni / dniExtra`; `Rb = max(cos θ, 0) / max(cos z, 0.01745)`.
`poaIsotropic = max(dhi (1 − AI) (1 + cos β)/2, 0)`, `poaCircumsolar = max(dhi · AI · Rb, 0)`,
`poaSkyDiffuse = poaIsotropic + poaCircumsolar`. The `cos z` floor (cos 89°) keeps Rb finite at
the horizon; sun below the horizon still yields the isotropic part, as pvlib. pvlib's
`projection_ratio` override and `return_components` are not exposed (scalar result only).

## Reference

- **Spec:** J. E. Hay, J. A. Davies, "Calculation of the solar radiation incident on an
  inclined surface", *Proc. First Canadian Solar Radiation Data Workshop*, 59–72, 1980.
- **Reference implementation:** `pvlib.irradiance.haydavies` @ pvlib 0.16.1.
- **Fixtures:** `hay-davies-fixtures.json` — the shared transposition scenario set (see
  `../irradiance.md`).
- **Tolerance:** `1e-12` relative to `max(1, |expected|)` W/m². Observed max error: 3.3e-16 (relative; non-finite outcomes match exactly).
