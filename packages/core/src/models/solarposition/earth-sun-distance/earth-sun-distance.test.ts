import { describe, expect, test } from "vitest";
import { earthSunDistance } from "./earth-sun-distance.ts";
import fixtures from "./earth-sun-distance-fixtures.json" with { type: "json" };

/** AU. Justification in earth-sun-distance.md → Reference. */
const TOLERANCE = 1e-12;

describe("earthSunDistance vs pvlib nrel_earthsun_distance", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    expect(Math.abs(earthSunDistance(input) - expected.distance)).toBeLessThan(TOLERANCE);
  });
});

test("matches the published Reda & Andreas example (Table A5.1: R = 0.9965422974 AU)", () => {
  const r = earthSunDistance({ timeMs: Date.UTC(2003, 9, 17, 19, 30, 30), deltaT: 67 });
  expect(Math.abs(r - 0.9965422974)).toBeLessThan(1e-10);
});

test("rejects a non-finite time", () => {
  expect(() => earthSunDistance({ timeMs: Number.POSITIVE_INFINITY })).toThrow(RangeError);
});
