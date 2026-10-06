# single-diode — I-V curve key points

## Principle

Sandia key points of `I = IL − I0·(exp((V + I·Rs)/a) − 1) − (V + I·Rs)/Rsh`:

- `iSc = I(0)`, `vOc = V(0)`, `iX = I(vOc/2)`, `iXx = I((vOc + vMp)/2)` — exact, `iFromV` / `vFromI`.
  `vOc` in `(−1e-12, 0)` is snapped to 0, as pvlib.
- Maximum power point in the diode voltage `Vd = V + I·Rs` (Bishop 1988):
  `I = IL − I0·expm1(Vd/a) − Vd/Rsh`, `V = Vd − I·Rs`. `dP/dV` (analytic, with its derivative,
  as pvlib's `bishop88`) is positive at `Vd = 0` and negative at `Vd = a·ln(1 + IL/I0)`, so
  Newton with bisection fallback inside that bracket converges to adjacent floats.
  `IL ≤ 0` (dark) → `Vd = 0`.

pvlib's default `singlediode` finds the MPP with scipy's bounded minimizer (≈1e-8 in V); the
fixtures instead use `bishop88_mpp` with `brentq` at `rtol = 4ε` so the reference is exact.

## Reference

- **Spec:** J. W. Bishop, "Computer simulation of the effects of electrical mismatches in
  photovoltaic cell interconnection circuits", *Solar Cells* 25 (1988) 73–89,
  https://doi.org/10.1016/0379-6787(88)90059-2; Jain & Kapoor 2004 (Lambert W);
  King et al. 2004, SAND2004-3535 (key points `Ix`, `Ixx`).
- **Reference implementation:** `pvlib.pvsystem.singlediode` (`lambertw`) for Isc, Voc, Ix;
  `pvlib.singlediode.bishop88_mpp` (`brentq`, xtol 1e-15, rtol 4ε) for Imp, Vmp, Pmp, and
  `i_from_v` at the resulting Vmp for Ixx — pvlib 0.16.1.
- **Fixtures:** `single-diode-fixtures.json` (184 parameter sets: CEC and PVsyst outputs over
  8 conditions incl. dark, plus Rs = 0, Rsh = ∞, extreme I0), `scripts/fixtures/diode.py`.
- **Tolerance:** `1e-11` absolute (A, V, W) + `1e-12` relative. Observed: MPP 1.2e-15
  relative; Voc 3.6e-12 V absolute (cancellation, see v-from-i).
