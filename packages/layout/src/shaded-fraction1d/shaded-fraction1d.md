# shaded-fraction1d

Anderson & Jensen 2024 eq. 32, with θT the projected solar zenith, R₁/R₂ the shading/shaded
row rotations, W collector width, P pitch, d axis offset, βc cross-axis slope:

t* = ½ + |cos(R₁−θT)| / (2|cos(R₂−θT)|) + sgn(θT)·d/W/|cos(R₂−θT)|·(sin(R₂−θT) − sin(R₁−θT))
     − P/W · cos(θT − βc) / |cos(R₂−θT)| / cos βc, clipped to [0, 1].

Fixed tilt is the tracker case with axisAzimuth = surfaceAzimuth − 90°, rotation = tilt.

## Reference

1. Spec — K. S. Anderson & A. R. Jensen 2024, "Shaded fraction and backtracking in
   single-axis trackers on rolling terrain", J. Renewable Sustainable Energy 16(2) 023504,
   doi:10.1063/5.0202220.
2. Reference implementation — `pvlib.shading.shaded_fraction1d` @ pvlib 0.16.1.
3. Fixtures — `scripts/fixtures/layout.py` → `shaded-fraction1d-fixtures.json` (2016 cases: fixed and tracker
   rows, axis tilt, torque-tube offset, cross-axis slope, distinct shading rotation).
   Tolerance 1e-12 absolute (a fraction).
