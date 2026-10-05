# relative-airmass — relative optical air mass

Relative (sea-level, not pressure-adjusted) air mass for one solar zenith angle `solarZenith` (`z`)
(degrees), by one of eight published models. Unitless.

## Principle

With `c = cos z`:

| model | formula | zenith |
| --- | --- | --- |
| `simple` | `1 / c` | apparent |
| `kasten1966` | `1 / (c + 0.15·(93.885 − z)^−1.253)` | apparent |
| `kastenyoung1989` (default) | `1 / (c + 0.50572·(96.07995 − z)^−1.6364)` | apparent |
| `gueymard1993` | `1 / (c + 0.00176759·z·(94.37515 − z)^−1.21563)` | apparent |
| `gueymard2003` | `1 / (c + 0.48353·z^0.095846 / (96.741 − z)^1.754)` | apparent |
| `pickering2002` | `1 / sin(h + 244 / (165 + 47·h^1.1))`, `h = 90 − z` | apparent |
| `youngirvine1967` | `s·(1 − 0.0012·(s² − 1))`, `s = 1/c` | true |
| `young1994` | `(1.002432c² + 0.148386c + 0.0096467) / (c³ + 0.149864c² + 0.0102963c + 0.000303978)` | true |

Guards (as pvlib): `z > 90°` → `NaN`. No clamp below the horizon. `simple` at exactly
90° returns ~1.6e16 (cos rounding), not `Infinity`. `youngirvine1967` diverges near the
horizon (fit only valid to z ≈ 80°); `gueymard2003` returns `NaN` for z < 0
(`z^0.095846`). Unknown `model` → `RangeError`; names are exact-case (pvlib lowercases).
Apparent zenith should be computed at sea level.

## Reference

- **Spec:** F. Kasten, A. T. Young, "Revised optical air mass tables and approximation
  formula", *Appl. Opt.* 28:4735–4738, 1989, doi:10.1364/AO.28.004735. Others: Kasten
  1965 (CRREL TR 136, doi:11681/5671); Young & Irvine 1967 (*Astron. J.* 72:945,
  doi:10.1086/110366); Gueymard 1993 (*Sol. Energy* 51:121, doi:10.1016/0038-092X(93)90074-X);
  Young 1994 (*Appl. Opt.* 33:1108, doi:10.1364/AO.33.001108); Pickering 2002 (*DIO* 12:3,
  http://dioi.org/jc01.pdf); Gueymard 2003 (*Sol. Energy* 74:355,
  doi:10.1016/S0038-092X(03)00195-6).
- **Reference implementation:** `pvlib.atmosphere.get_relative_airmass(zenith, model)` @
  pvlib 0.16.1, every model.
- **Fixtures:** `relative-airmass-fixtures.json` (208 cases = 8 models × 26 zeniths: 0°,
  1e-6°, 30–89.9°, exactly 90°, 90.5°, 120° (`null` = NaN), −10°, 8 random 0–84°, 4 random
  84–90°), from `scripts/fixtures/atmosphere-relative-airmass.py`. Kasten-Young eq. (3)
  horizon value AM(90°) ≈ 37.92 is also asserted.
- **Tolerance:** `1e-12` relative. Observed max ≈ 2e-16 relative (1 ULP). Same closed forms in float64;
  `cos` near 90° amplifies 1-ULP `Math.cos`/`**` differences in the `simple` /
  `youngirvine1967` divergent cases, hence relative not absolute.
