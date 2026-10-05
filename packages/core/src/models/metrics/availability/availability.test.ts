import { describe, expect, test } from "vitest";
import { availability } from "./availability.ts";
import fixtures from "./availability-fixtures.json" with { type: "json" };

/** Relative. Justification in availability.md → Reference. */
const TOLERANCE = 1e-15;
const rel = (got: number, want: number) => Math.abs(got - want) / Math.max(1e-300, Math.abs(want));

describe("availability vs time-based formula", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    const got = availability(input);
    const want = expected.availability;
    expect(want === 0 ? Math.abs(got) : rel(got, want)).toBeLessThan(TOLERANCE);
  });
});

test("hand-checkable example", () => {
  expect(availability({ available: [1, 1, 0, 1] })).toBe(0.75);
});

test("rejects empty series and values outside [0, 1]", () => {
  expect(() => availability({ available: [] })).toThrow(RangeError);
  expect(() => availability({ available: [1, 1.5] })).toThrow(RangeError);
  expect(() => availability({ available: [-0.1] })).toThrow(RangeError);
  expect(() => availability({ available: [Number.NaN] })).toThrow(RangeError);
});
