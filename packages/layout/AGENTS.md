# @pvkit/layout — agent notes

Shared rules: `doc/conventions.md` (units, fixtures), `doc/architecture.md` (exports, release).

- Layout: one folder per method under `src/` (`index.ts`, impl, `.md` with `## Reference`,
  test, fixtures). Public subpath `@pvkit/layout/<method>`; tsdown generates `exports` —
  `pnpm build` and commit `package.json` after adding a folder.
- Fixtures: `scripts/fixtures/layout.py` (pvlib.shading, numpy.interp). `min-pitch` and
  `roof-fit` have no external reference: min-pitch is checked as the root of
  `shadedFraction1d`, roof-fit by hand counts.
- Returned angles are plain `number` degrees (no dependency on `@pvkit/core` brands).
- Method folders may import each other inside this package (min-pitch, shaded-fraction1d
  → projected-solar-zenith-angle).
- Deferred: bifacial view factors (pvlib `bifacial.infinite_sheds`), 3-D/obstacle shading,
  tilt/azimuth optimisation (needs a yield loop — `@pvkit/chain`, or PVGIS `optimalangles`).
