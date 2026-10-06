import { describe, expect, test } from "vitest";
import { capacityFactor } from "./capacity-factor.ts";
import fixtures from "./capacity-factor-fixtures.json" with { type: "json" };

/** Relative. Justification in capacity-factor.md → Reference. */
const TOLERANCE = 1e-15;
const rel = (got: number, want: number) => Math.abs(got - want) / Math.max(1e-300, Math.abs(want));

describe("capacityFactor vs NREL formula", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    const got = capacityFactor(input);
    const want = expected.capacityFactor;
    expect(want === 0 ? Math.abs(got) : rel(got, want)).toBeLessThan(TOLERANCE);
  });
});

test("hand-checkable example", () => {
  // 5 kW running at 20% for a year.
  expect(capacityFactor({ energy: [8760], nameplateKw: 5, hours: 8760 })).toBeCloseTo(0.2, 15);
});

test("rejects non-positive or non-finite nameplateKw / hours", () => {
  expect(() => capacityFactor({ energy: [1], nameplateKw: 0, hours: 1 })).toThrow(RangeError);
  expect(() => capacityFactor({ energy: [1], nameplateKw: 1, hours: -1 })).toThrow(RangeError);
  expect(() => capacityFactor({ energy: [1], nameplateKw: 1, hours: Number.NaN })).toThrow(
    RangeError,
  );
});
