# gueymard94-pw — precipitable water from temperature and humidity

## Principle

With `T = t + 273.15` K, `θ = T / 273.15`, `RH` in %:

- saturation vapour density `ρv = 216.7·RH/(100·T) · exp(22.330 − 49.140·(100/T) −
  10.922·(100/T)² − 0.39015·T/100)` (g/m³)
- apparent water-vapour scale height `Hv = 0.4976 + 1.5265·θ + exp(13.6897·θ −
  14.9188·θ³)` (km)
- `w = 0.1 · Hv · ρv` (cm), floored at 0.1 cm (as pvlib).

Guards: only the 0.1 cm floor; no RH/temperature range check (pvlib has none; NaN
propagates).

## Reference

- **Spec:** C. Gueymard, "Analysis of monthly average atmospheric precipitable water and
  turbidity in Canada and northern United States", *Sol. Energy* 53(1):57–71, 1994,
  doi:10.1016/S0038-092X(94)90606-8. Also Keogh & Blakers, "Accurate measurement, using
  natural sunlight, of silicon solar cells", *Prog. Photovolt.* 12:1–19, 2004,
  doi:10.1002/pip.517.
- **Reference implementation:** `pvlib.atmosphere.gueymard94_pw(temp_air,
  relative_humidity)` @ pvlib 0.16.1.
- **Fixtures:** `gueymard94-pw-fixtures.json` (60 cases: 0 % RH (floor), −40 °C to 50 °C,
  RH 0.5–100 %, 50 random −40–50 °C × 0–100 %), from
  `scripts/fixtures/atmosphere-gueymard94-pw.py`.
- **Tolerance:** `1e-12` relative. Observed max ≈ 1e-15 relative. Same closed form; `exp`/`**`
  1-ULP differences only.
