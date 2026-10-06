import { describe, expect, test } from "vitest";
import { lcoe } from "./lcoe.ts";
import fixtures from "./lcoe-fixtures.json" with { type: "json" };

/** Relative. Justification in lcoe.md → Reference. */
const TOLERANCE = 1e-14;
const rel = (got: number, want: number) => Math.abs(got - want) / Math.max(1e-300, Math.abs(want));

describe("lcoe vs explicit formula", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    expect(rel(lcoe(input), expected.lcoe)).toBeLessThan(TOLERANCE);
  });
});

test("hand-checkable example", () => {
  expect(lcoe({ costs: [1000, 10, 10], energy: [0, 1000, 1000], discountRate: 0 })).toBeCloseTo(
    0.51,
    15,
  );
});

test("rejects mismatched lengths and discountRate ≤ -1", () => {
  expect(() => lcoe({ costs: [1], energy: [0, 1], discountRate: 0 })).toThrow(RangeError);
  expect(() => lcoe({ costs: [1], energy: [1], discountRate: -2 })).toThrow(RangeError);
});
