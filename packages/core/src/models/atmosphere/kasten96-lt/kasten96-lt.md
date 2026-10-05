# kasten96-lt — Linke turbidity factor

## Principle

With `m` the absolute air mass, `w` precipitable water (cm), `τa` broadband AOD:

- clean-dry-atmosphere optical depth `δcda = −0.101 + 0.235·m^−0.16`
- water-vapour optical depth `δw = 0.112·m^−0.55·w^0.34`
- `TL = −(9.4 + 0.9m)·ln(exp(−m·(δcda + δw + τa))) / m = (9.4 + 0.9m)·(δcda + δw + τa)`

pvlib evaluates the `ln(exp(·))` form literally; pvkit uses the algebraically identical
simplification. Guards as pvlib: `m ≤ 0` → `NaN` (pvlib's `0/0`), `w < 0` → `NaN`.
Deviation: where `exp(−m·δ)` underflows (`m·δ ≳ 745`, far outside physical inputs) pvlib
returns `Infinity`; pvkit returns the finite exact value.

## Reference

- **Spec:** F. Kasten, "The Linke turbidity factor based on improved values of the
  integral Rayleigh optical thickness", *Sol. Energy* 56(3):239–244, 1996,
  doi:10.1016/0038-092X(95)00114-7; parametrization B. Molineaux, P. Ineichen,
  N. O'Neill, "Equivalence of pyrheliometric and monochromatic aerosol optical depths at
  a single key wavelength", *Appl. Opt.* 37(30):7008–7018, 1998,
  doi:10.1364/AO.37.007008; P. Ineichen, "Conversion function between the Linke
  turbidity and the atmospheric water vapor and aerosol content", *Sol. Energy*
  82:1095–1097, 2008, doi:10.1016/j.solener.2008.04.010.
- **Reference implementation:** `pvlib.atmosphere.kasten96_lt(airmass_absolute,
  precipitable_water, aod_bb)` @ pvlib 0.16.1.
- **Fixtures:** `kasten96-lt-fixtures.json` (50 cases: zero water/AOD, AM 0.5 and 38,
  water 0.1–7 cm, AOD 0–1, 43 random), from `scripts/fixtures/atmosphere-kasten96-lt.py`.
- **Tolerance:** `1e-12` relative. Observed max ≈ 3e-16 relative. The skipped `ln(exp(x))`
  round trip contributes a few ULP of `x` in pvlib; nothing else differs.
