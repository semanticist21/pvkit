# projected-solar-zenith-angle

Sun vector (sx, sy, sz) = (sin z sin γ, sin z cos γ, cos z) rotated into the axis frame
(axis azimuth γa, tilt βa); θT = atan2(sx', sz') with
sx' = sx cos γa − sy sin γa and sz' = sx sin γa sin βa + sy sin βa cos γa + sz cos βa.

## Reference

1. Spec — K. Anderson & M. Mikofski 2020, "Slope-Aware Backtracking for Single-Axis
   Trackers", NREL/TP-5K00-76626, doi:10.2172/1660126, eq. 5.
2. Reference implementation — `pvlib.shading.projected_solar_zenith_angle` @ pvlib 0.16.1.
3. Fixtures — `scripts/fixtures/layout.py` → `projected-solar-zenith-angle-fixtures.json` (zenith 0–95°, all
   quadrants, axis tilt 0–20°). Tolerance 1e-12 relative.
