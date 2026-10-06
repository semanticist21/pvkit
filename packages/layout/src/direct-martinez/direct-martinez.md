# direct-martinez

Loss = 1 − (E_b·(1 − SF)(1 − ⌈N_sb⌉/(N_tb + 1)) + E_d) / E_g, with E_b direct, E_d = E_g − E_b
diffuse POA: a shaded cell kills its bypass-diode block's beam contribution.

## Reference

1. Spec — F. Martínez-Moreno, J. Muñoz & E. Lorenzo 2010, "Experimental model to estimate
   shading losses on PV arrays", Sol. Energy Mater. Sol. Cells 94(12) 2298–2303,
   doi:10.1016/j.solmat.2010.07.029, eq. 2.
2. Reference implementation — `pvlib.shading.direct_martinez` @ pvlib 0.16.1.
3. Fixtures — `scripts/fixtures/layout.py` → `direct-martinez-fixtures.json`. Tolerance 1e-14 relative.
