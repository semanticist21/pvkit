import { describe, expect, test } from "vitest";
import { hourAngle } from "./hour-angle.ts";
import fixtures from "./hour-angle-fixtures.json" with { type: "json" };

/** Degrees. Justification in hour-angle.md → Reference. */
const TOLERANCE = 1e-9;

describe("hourAngle vs pvlib hour_angle (UTC times)", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    const got = hourAngle(input);
    expect(got).toBeGreaterThanOrEqual(-180);
    expect(got).toBeLessThan(180);
    // pvlib does not wrap; compare modulo 360°.
    const err = Math.abs(got - expected.hourAngle) % 360;
    expect(Math.min(err, 360 - err)).toBeLessThan(TOLERANCE);
  });
});

test("solar noon at Greenwich with E = 0 is ω = 0; 15° per hour", () => {
  expect(
    hourAngle({ timeMs: Date.UTC(2025, 5, 21, 12), longitude: 0, equationOfTime: 0 }),
  ).toBeCloseTo(0, 12);
  expect(
    hourAngle({ timeMs: Date.UTC(2025, 5, 21, 13), longitude: 0, equationOfTime: 0 }),
  ).toBeCloseTo(15, 12);
});

test("rejects a non-finite time", () => {
  expect(() => hourAngle({ timeMs: Number.NaN, longitude: 0, equationOfTime: 0 })).toThrow(
    RangeError,
  );
});
