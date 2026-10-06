# i-from-v — current at a voltage (exact)

## Principle

Single-diode equation `I = IL − I0·(exp((V + I·Rs)/nNsVth) − 1) − (V + I·Rs)/Rsh`, solved
explicitly with the Lambert W function (`Gsh = 1/Rsh`, `a = nNsVth`, `D = Rs·Gsh + 1`):

`I = (IL + I0 − V·Gsh)/D − (a/Rs)·W(Rs·I0/(a·D) · exp((Rs·(IL + I0) + V)/(a·D)))`;
`Rs = 0` → `I = IL − I0·expm1(V/a) − Gsh·V`.

W is computed from the *logarithm* of its argument (`lambertWExp`, Newton on
`w + ln w = ln x`), so the result stays finite for any `V`; pvlib evaluates the argument
directly and returns NaN once it overflows (V far above Voc).

## Reference

- **Spec:** A. Jain, A. Kapoor, "Exact analytical solutions of the parameters of real solar
  cells using Lambert W-function", *Sol. Energy Mater. Sol. Cells* 81 (2004) 269–277,
  https://doi.org/10.1016/j.solmat.2003.11.018.
- **Reference implementation:** `pvlib.pvsystem.i_from_v` (method `lambertw`) @ pvlib 0.16.1.
- **Fixtures:** `i-from-v-fixtures.json` (1104 cases: every single-diode parameter set ×
  V ∈ {0, Voc/2, 0.9·Voc, Voc, 1.05·Voc, −1 V}, incl. Rs = 0, Rsh = ∞, dark), `scripts/fixtures/diode.py`.
  Cases where pvlib overflows are skipped.
- **Tolerance:** `|ΔI| ≤ 1e-11 A + 1e-12·|I|`. Observed max |ΔI| 1.8e-14 A. Absolute floor
  because the formula subtracts two terms of size ~IL; at zero irradiance pvlib returns
  ~1e-21 A where the exact answer is 0.
