# v-from-i — voltage at a current (exact)

## Principle

Single-diode equation solved for V with Lambert W (`Gsh = 1/Rsh`, `a = nNsVth`):

`V = (IL + I0 − I)/Gsh − I·Rs − a·W(I0/(Gsh·a) · exp((IL + I0 − I)/(Gsh·a)))`;
`Rsh = ∞` → `V = a·ln(1 + (IL − I)/I0) − I·Rs`.

The W argument routinely overflows float64 (`(IL + I0 − I)/(Gsh·a)` reaches thousands);
`lambertWExp` takes its logarithm, matching pvlib's log-space branch for those cases.

## Reference

- **Spec:** Jain & Kapoor 2004 (see i-from-v).
- **Reference implementation:** `pvlib.pvsystem.v_from_i` (method `lambertw`) @ pvlib 0.16.1.
- **Fixtures:** `v-from-i-fixtures.json` (1087 cases: every single-diode parameter set ×
  I ∈ {0, Isc/2, 0.95·Isc, Isc, 1.1·Isc, Isc + 10 A}, incl. Rs = 0, Rsh = ∞, dark; past Isc the
  W argument often underflows to 0; Rsh = ∞ past IL + I0 is NaN in pvlib and skipped), `scripts/fixtures/diode.py`.
- **Tolerance:** `|ΔV| ≤ 1e-11 V + 1e-12·|V|`. Observed max |ΔV| 3.6e-12 V: the first term is
  ~(IL·Rsh) ≈ 10³ V and cancels against `a·W`, so the result carries ~10³·ε absolute error.
