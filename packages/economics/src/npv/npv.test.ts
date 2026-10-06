import { describe, expect, test } from "vitest";
import { npv } from "./npv.ts";
import fixtures from "./npv-fixtures.json" with { type: "json" };

/** Absolute, scaled by Σ|CF_t|/(1+r)^t. Justification in npv.md → Reference. */
const TOLERANCE = 1e-14;

describe("npv vs numpy-financial", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    expect(Math.abs(npv(input) - expected.npv) / expected.scale).toBeLessThan(TOLERANCE);
  });
});

test("numpy-financial docstring example", () => {
  expect(npv({ cashFlows: [-40000, 5000, 8000, 12000, 30000], discountRate: 0.08 })).toBeCloseTo(
    3065.22267,
    5,
  );
});

test("rejects discountRate ≤ -1", () => {
  expect(() => npv({ cashFlows: [1], discountRate: -1 })).toThrow(RangeError);
});
