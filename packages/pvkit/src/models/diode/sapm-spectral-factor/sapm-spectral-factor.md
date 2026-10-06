# sapm-spectral-factor — SAPM air-mass spectral modifier F1

## Principle

`F1 = max(0, A0 + A1·AM + A2·AM² + A3·AM³ + A4·AM⁴)` of absolute air mass, evaluated by
Horner's rule (as `np.polyval`); NaN air mass (sun down) → 0.

## Reference

- **Spec:** King, Boyson & Kratochvil 2004, SAND2004-3535 (see sapm).
- **Reference implementation:** `pvlib.spectrum.spectral_factor_sapm` @ pvlib 0.16.1.
- **Fixtures:** `sapm-spectral-factor-fixtures.json` (75 cases: 15 Sandia modules × AM 1,
  1.5, random 1–10, 30, NaN), `scripts/fixtures/diode.py`.
- **Tolerance:** `1e-14` relative. Observed max error: 0.
