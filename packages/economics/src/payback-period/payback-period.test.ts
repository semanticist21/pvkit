import { describe, expect, test } from "vitest";
import { paybackPeriod } from "./payback-period.ts";
import fixtures from "./payback-period-fixtures.json" with { type: "json" };

/** Absolute, years. Justification in payback-period.md → Reference. */
const TOLERANCE = 1e-12;

describe("paybackPeriod vs explicit formula", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    const got = paybackPeriod(input);
    if (expected.paybackPeriod === null) expect(got).toBe(Number.POSITIVE_INFINITY);
    else expect(Math.abs(got - expected.paybackPeriod)).toBeLessThan(TOLERANCE);
  });
});

test("hand-checkable examples", () => {
  expect(paybackPeriod({ cashFlows: [-1000, 400, 400, 400] })).toBeCloseTo(2.5, 15);
  expect(paybackPeriod({ cashFlows: [0, 10] })).toBe(0);
  expect(paybackPeriod({ cashFlows: [-1000, 100] })).toBe(Number.POSITIVE_INFINITY);
});

test("rejects discountRate ≤ -1", () => {
  expect(() => paybackPeriod({ cashFlows: [-1, 2], discountRate: -1 })).toThrow(RangeError);
});
