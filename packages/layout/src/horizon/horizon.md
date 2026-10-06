# horizon

Linear interpolation of a horizon profile (azimuth → elevation) around the circle: profile
azimuths are wrapped to [0, 360), sorted, and the ends joined across north. Feed it a
PVGIS horizon (`api/printhorizon`), a surveyed skyline or a DEM sweep; compare with the
sun's apparent elevation to zero the beam.

## Reference

1. Spec — linear interpolation on a periodic domain (the PVGIS horizon tool interpolates
   its 48-point profile the same way: Huld 2017, "PVMAPS: Software tools and data for the
   estimation of solar radiation and photovoltaic module performance over large
   geographical areas", Solar Energy 142).
2. Reference implementation — `numpy.interp(azimuth, xp, fp, period=360)`.
3. Fixtures — `scripts/fixtures/layout.py` → `horizon-fixtures.json` (wrap-around, exact nodes, > 360 and < 0).
   Tolerance 1e-12.
