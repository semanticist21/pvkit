import { expect, test } from "vitest";
import { type EstimateInput, estimate } from "./estimate.ts";

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

test("clear-sky yield is plausible and months sum to the year", () => {
  const r = estimate(seoul);
  expect(r.monthlyKwh).toHaveLength(12);
  expect(r.monthlyKwh.every((m) => m > 0)).toBe(true);
  expect(r.annualKwh).toBeCloseTo(
    r.monthlyKwh.reduce((a, b) => a + b),
    9,
  );
  // Clear sky at 37.6°N: well above typical real-world ~1300 kWh/kWp, below the sun's ceiling.
  expect(r.specificYield).toBeGreaterThan(1500);
  expect(r.specificYield).toBeLessThan(2400);
});

test("orientation matters: south-facing beats north-facing in the northern hemisphere", () => {
  expect(estimate(seoul).annualKwh).toBeGreaterThan(estimate({ ...seoul, azimuth: 0 }).annualKwh);
});

test("losses scale DC before the inverter", () => {
  expect(estimate({ ...seoul, losses: 0.3 }).annualKwh).toBeLessThan(estimate(seoul).annualKwh);
});
