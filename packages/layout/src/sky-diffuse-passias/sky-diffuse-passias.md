# sky-diffuse-passias

Sky-diffuse loss fraction for a masking angle ψ: 1 − cos²(ψ/2) (isotropic sky).
Multiply the unshaded sky-diffuse POA by (1 − loss).

## Reference

1. Spec — Passias & Källbäck 1984 (see masking-angle); Gilman et al. 2018 (SAM).
2. Reference implementation — `pvlib.shading.sky_diffuse_passias` @ pvlib 0.16.1.
3. Fixtures — `scripts/fixtures/layout.py` → `sky-diffuse-passias-fixtures.json`. Tolerance 1e-14 relative.
