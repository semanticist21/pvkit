# isotropic — isotropic sky diffuse on a tilted plane

## Principle

`poaSkyDiffuse = dhi · (1 + cos β) / 2`: the sky is a uniform-radiance dome and the tilted
plane sees the view factor `(1 + cos β)/2` of it. No guards; zero/negative dhi passes through.

## Reference

- **Spec:** B. Y. H. Liu, R. C. Jordan, "The long-term average performance of flat-plate
  solar-energy collectors", *Solar Energy* 7(2):53–74, 1963,
  doi:10.1016/0038-092X(63)90006-9 (after Hottel & Woertz 1942).
- **Reference implementation:** `pvlib.irradiance.isotropic` @ pvlib 0.16.1.
- **Fixtures:** `isotropic-fixtures.json` — the shared transposition scenario set (see
  `../irradiance.md`).
- **Tolerance:** `1e-12` relative to `max(1, |expected|)` W/m². Observed max error: 1.4e-16 (relative; non-finite outcomes match exactly).
