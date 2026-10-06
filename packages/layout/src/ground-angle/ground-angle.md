# ground-angle

ψ = atan2(g·h·sin β, g·h·cos β + 1), g = GCR, h = slant fraction, β = tilt. The angle from
horizontal to the foot of the facing row; the ground between is what the point sees.

## Reference

1. Spec — Mikofski, Darawali, Hamer, Neubert & Newmiller 2019, "Bifacial Performance
   Modeling in Large Arrays", IEEE PVSC 46 (view-factor geometry); Marion et al. 2017,
   "A Practical Irradiance Model for Bifacial PV Modules", IEEE PVSC 44.
2. Reference implementation — `pvlib.shading.ground_angle` @ pvlib 0.16.1.
3. Fixtures — `scripts/fixtures/layout.py` → `ground-angle-fixtures.json` (tilt 0–90°, GCR 0.01–1, slant 0–1).
   Tolerance 1e-12 relative: same closed form, one atan2.
