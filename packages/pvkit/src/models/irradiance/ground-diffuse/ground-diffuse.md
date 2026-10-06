# ground-diffuse — ground-reflected irradiance on a tilted plane

## Principle

`poaGroundDiffuse = ghi · albedo · (1 − cos β) / 2`: an isotropically reflecting infinite
horizontal ground seen with view factor `(1 − cos β)/2`. Albedo default 0.25. pvlib's
`surface_type` lookup table is not included — pass the albedo directly.

## Reference

- **Spec:** B. Y. H. Liu, R. C. Jordan, *Solar Energy* 7(2):53–74, 1963,
  doi:10.1016/0038-092X(63)90006-9.
- **Reference implementation:** `pvlib.irradiance.get_ground_diffuse(surface_tilt, ghi,
  albedo)` @ pvlib 0.16.1.
- **Fixtures:** `ground-diffuse-fixtures.json` — the shared transposition scenario set (see
  `../irradiance.md`).
- **Tolerance:** `1e-12` relative to `max(1, |expected|)` W/m². Observed max error: 9.6e-16 (relative; non-finite outcomes match exactly).
