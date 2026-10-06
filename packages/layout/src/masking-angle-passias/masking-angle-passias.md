# masking-angle-passias

Slant-averaged masking angle (Passias & Källbäck eq. 9), X = 1/GCR:

ψ̄ = −X sin β ln|2X cos β − (X² + 1)| / 2 + (X cos β − 1) atan((X cos β − 1)/(X sin β))
   + (1 − X cos β) atan(cos β / sin β) + X ln X sin β

Non-finite results (β = 0, GCR = 1 singularities) → 0, as pvlib.

## Reference

1. Spec — Passias & Källbäck 1984 (see masking-angle), eq. 9.
2. Reference implementation — `pvlib.shading.masking_angle_passias` @ pvlib 0.16.1.
3. Fixtures — `scripts/fixtures/layout.py` → `masking-angle-passias-fixtures.json`. Tolerance 1e-10 relative:
   the four terms cancel heavily near β → 0, losing a few digits in both implementations.
