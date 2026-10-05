import { describe, expect, test } from "vitest";
import { calcCrossAxisTilt } from "./calc-cross-axis-tilt.ts";
import fixtures from "./calc-cross-axis-tilt-fixtures.json" with { type: "json" };

/** Degrees. Justification in calc-cross-axis-tilt.md → Reference. */
const TOLERANCE = 1e-12;

describe("calcCrossAxisTilt vs pvlib tracking.calc_cross_axis_tilt", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    expect(Math.abs(calcCrossAxisTilt(input) - expected.crossAxisTilt)).toBeLessThan(TOLERANCE);
  });
});

test("slope across a south axis gives ±slope tilt; along it gives 0 (sign convention)", () => {
  const south = { slopeTilt: 10, axisAzimuth: 180, axisTilt: 0 };
  expect(calcCrossAxisTilt({ ...south, slopeAzimuth: 90 })).toBeCloseTo(-10, 12); // falls east
  expect(calcCrossAxisTilt({ ...south, slopeAzimuth: 270 })).toBeCloseTo(10, 12); // falls west
  expect(calcCrossAxisTilt({ ...south, slopeAzimuth: 180, axisTilt: 10 })).toBeCloseTo(0, 12);
});
