# horizon

Linear interpolation of a horizon profile (azimuth → elevation) around the circle: profile
azimuths are wrapped to [0, 360), sorted, and the ends joined across north. A NaN azimuth
gives NaN. Feed it a surveyed skyline, a DEM sweep or a PVGIS horizon (`api/printhorizon`);
compare with the sun's apparent elevation to zero the beam.

PVGIS measures `A` from **south** (0 = S, −90 = E, +90 = W, −180…180), while this takes
azimuth from north, clockwise: use `{ azimuth: A + 180, elevation: H_hor }` (as pvlib's
`get_pvgis_horizon`). Unshifted rows are accepted silently and rotate the horizon by 180°.
The duplicate north point (A = ±180) is harmless.

## Reference

1. Spec — linear interpolation on a periodic domain (the PVGIS horizon tool interpolates
   its 48-point profile the same way: Huld 2017, "PVMAPS: Software tools and data for the
   estimation of solar radiation and photovoltaic module performance over large
   geographical areas", Solar Energy 142).
2. Reference implementation — `numpy.interp(azimuth, xp, fp, period=360)`.
3. Fixtures — `scripts/fixtures/layout.py` → `horizon-fixtures.json` (wrap-around, exact nodes, > 360 and < 0).
   Tolerance 1e-12: one linear interpolation, same arithmetic as numpy, so only rounding
   (~1e-15 on elevations ≤ 20°) separates the two.
