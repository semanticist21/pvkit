# masking-angle

φ = atan(g(1−h) sin β / (1 − g(1−h) cos β)) — Passias & Källbäck eq. 8 divided through by
pitch. SAM evaluates it at the bottom of the module (h = 0, worst case). At g(1−h) = 1 and
β = 0 the ratio is 0/0 → NaN, as pvlib.

## Reference

1. Spec — D. Passias & B. Källbäck 1984, "Shading effects in rows of solar cell panels",
   Solar Cells 11, 281–291, doi:10.1016/0379-6787(84)90017-6; Gilman et al. 2018, SAM PV
   Model Technical Reference Update, NREL/TP-6A20-67399.
2. Reference implementation — `pvlib.shading.masking_angle` @ pvlib 0.16.1.
3. Fixtures — `scripts/fixtures/layout.py` → `masking-angle-fixtures.json`. Tolerance 1e-12 relative.
