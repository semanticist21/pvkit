import { describe, expect, test } from "vitest";
import { calcAxisTilt } from "./calc-axis-tilt.ts";
import fixtures from "./calc-axis-tilt-fixtures.json" with { type: "json" };

/** Degrees. Justification in calc-axis-tilt.md → Reference. */
const TOLERANCE = 1e-12;

describe("calcAxisTilt vs pvlib tracking.calc_axis_tilt", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    expect(Math.abs(calcAxisTilt(input) - expected.axisTilt)).toBeLessThan(TOLERANCE);
  });
});

test("axis along the slope takes the full slope; axis across it stays level (eq. 18)", () => {
  expect(calcAxisTilt({ slopeAzimuth: 180, slopeTilt: 10, axisAzimuth: 180 })).toBeCloseTo(10, 12);
  expect(calcAxisTilt({ slopeAzimuth: 180, slopeTilt: 10, axisAzimuth: 0 })).toBeCloseTo(-10, 12);
  expect(calcAxisTilt({ slopeAzimuth: 90, slopeTilt: 10, axisAzimuth: 180 })).toBeCloseTo(0, 12);
});
