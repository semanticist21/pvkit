# marion — diffuse IAM by solid-angle integration

`marionIntegrate` (one region) and `marionDiffuse` (sky, horizon, ground) turn any beam IAM
function into an isotropic-diffuse IAM for a surface tilt.

## Principle

Grid (Marion 2017, Section 3 pseudocode): zenith `φ1 = i·Δ`, `i = 0…num−1`, azimuth
`ψ1 = j·Δ`, `j = 0…2num−1`, `Δ = π/num`; evaluate at patch midpoints
`φ = φ1 + Δ/2`, `ψ = ψ1 + Δ/2`.

- Region masks on `φ1`: sky `φ1 + Δ ≤ π/2`; horizon `89.5° ≤ φ1` and `φ1 + Δ ≤ π/2`;
  ground `φ1 ≥ π/2`.
- `cos aoi = cos β cos φ + sin β sin φ cos ψ` (surface azimuth 0 — the isotropic integral is
  rotation-invariant), `aoi = acos(cos aoi)`.
- Patch solid angle `dA = Δ·(cos φ1 − cos(φ1 + Δ))` (Eq. 8).
- Weight `w = cos aoi · dA` where `aoi < 90°`, else 0.
- `Fd = Σ IAM(aoi)·w / Σ w`, both sums Neumaier-compensated.

Defaults `num = 180` (sky, ground) and `1800` (horizon), as the paper. If no patch passes
(e.g. ground at tilt 0) `Fd = 0`; NaN tilt → NaN. `iam` is called on every patch, masked ones
included (weight 0), exactly as pvlib — a NaN from `iam` propagates. `num` must be a positive
integer (`RangeError`). The IAM function is a caller-supplied closure, e.g.
`(aoi) => physical({ aoi, n: 1.3 })`, replacing pvlib's model-name string + kwargs.

## Reference

- **Spec:** B. Marion, "Numerical method for angle-of-incidence correction factors for
  diffuse radiation incident photovoltaic modules", *Solar Energy* 147:344–348, 2017,
  doi:10.1016/j.solener.2017.03.027.
- **Reference implementation:** `pvlib.iam.marion_integrate(function, surface_tilt, region,
  num)` and `pvlib.iam.marion_diffuse(model, surface_tilt, **kwargs)` @ pvlib 0.16.1.
- **Fixtures:** `marion-fixtures.json` (44 cases × 3 regions: physical / ashrae /
  martin-ruiz / sapm at tilts 0, 20, 45, 90, 135, 180 and 10 random; pvlib docstring examples
  (ashrae b=0.04, physical n=1.3); AR-coated physical; `num` 1, 7, 90, 360, 2000), generated
  by `scripts/fixtures/iam-marion.py`, which also asserts `marion_diffuse` equals the three
  `marion_integrate` calls. The pvlib docstring values for physical at tilt 20 are asserted.
- **Tolerance:** `1e-12`. Observed max error vs pvlib on V8: 8.9e-16 — numpy's pairwise sum
  and Neumaier summation over ≤ 64 800 patches differ only in rounding.
