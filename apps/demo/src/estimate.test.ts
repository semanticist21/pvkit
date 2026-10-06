import { expect, test } from "vitest";
import { type EstimateInput, estimate } from "./estimate.ts";
import fixtures from "./estimate-fixtures.json" with { type: "json" };

const seoul: EstimateInput = {
  latitude: 37.5665,
  longitude: 126.978,
  altitude: 38,
  tilt: 30,
  azimuth: 180,
  dcKw: 5,
  losses: 0.14,
  linkeTurbidity: 3,
  tempAir: 20,
};
// Reference: scripts/fixtures/demo-estimate.py runs the same chain in pvlib 0.16.1. Observed
// agreement ~3e-5; rtol 1e-4 covers the SPA/float differences each module's own fixtures
// already bound, and fails on any miswired step (losses, tilt, temperature, clipping).
test.each(fixtures.cases)(
  "matches pvlib month by month at $input.longitude°",
  ({ input, monthlyKwh }) => {
    const r = estimate(input);
    expect(r.monthlyKwh).toHaveLength(12);
    r.monthlyKwh.forEach((k, i) => {
      expect(Math.abs(k / (monthlyKwh[i] as number) - 1)).toBeLessThan(1e-4);
    });
    expect(r.annualKwh).toBeCloseTo(
      r.monthlyKwh.reduce((a, b) => a + b),
      9,
    );
    expect(r.specificYield).toBeCloseTo(r.annualKwh / input.dcKw, 9);
  },
);

test("orientation matters: south-facing beats north-facing in the northern hemisphere", () => {
  expect(estimate(seoul).annualKwh).toBeGreaterThan(estimate({ ...seoul, azimuth: 0 }).annualKwh);
});

test("more losses means less energy", () => {
  expect(estimate({ ...seoul, losses: 0.3 }).annualKwh).toBeLessThan(estimate(seoul).annualKwh);
});
