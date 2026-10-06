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
  // fully subsidized year 0, then a net-negative year: never pays back, not 0
  expect(paybackPeriod({ cashFlows: [0, -100, 50] })).toBe(Number.POSITIVE_INFINITY);
});

test("rejects discountRate ≤ -1 and non-finite flows", () => {
  expect(() => paybackPeriod({ cashFlows: [-1, 2], discountRate: -1 })).toThrow(RangeError);
  expect(() => paybackPeriod({ cashFlows: [-100, Number.NaN, 200] })).toThrow(RangeError);
});

test("worked example: simple and discounted payback of [-1000, 400, 440, 484]", () => {
  const cashFlows = [-1000, 400, 440, 484];
  // simple: cumulative −600, −160, +324 → 2 + 160/484
  expect(paybackPeriod({ cashFlows })).toBeCloseTo(2 + 160 / 484, 14);
  // r = 10 %: each year discounts (year 0 undiscounted) to 4000/11 → 2 + (3000/11)/(4000/11)
  expect(paybackPeriod({ cashFlows, discountRate: 0.1 })).toBeCloseTo(2.75, 14);
});
