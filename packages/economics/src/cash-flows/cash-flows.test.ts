import { describe, expect, test } from "vitest";
import { cashFlows } from "./cash-flows.ts";
import fixtures from "./cash-flows-fixtures.json" with { type: "json" };

/** Relative (absolute where the expected value is 0). Justification in cash-flows.md. */
const TOLERANCE = 1e-14;
const rel = (got: number, want: number) => Math.abs(got - want) / Math.max(1e-300, Math.abs(want));

describe("cashFlows vs explicit formula", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    const got = cashFlows(input);
    expect(got).toHaveLength(expected.cashFlows.length);
    got.forEach((v, t) => {
      const want = expected.cashFlows[t] as number;
      expect(want === 0 ? Math.abs(v) : rel(v, want)).toBeLessThan(TOLERANCE);
    });
  });
});

test("hand-checkable example", () => {
  const got = cashFlows({ capitalCost: 10000, energy: [5000, 4975], energyPrice: 0.2 });
  expect(got[0]).toBe(-10000);
  expect(got[1]).toBeCloseTo(1000, 12);
  expect(got[2]).toBeCloseTo(995, 12);
});

test("rejects non-finite costs and escalation ≤ -1", () => {
  expect(() => cashFlows({ capitalCost: Number.NaN, energy: [], energyPrice: 0.2 })).toThrow(
    RangeError,
  );
  expect(() =>
    cashFlows({ capitalCost: 1, energy: [], energyPrice: 0.2, priceEscalation: -1 }),
  ).toThrow(RangeError);
  expect(() => cashFlows({ capitalCost: 1, energy: [1, Infinity], energyPrice: 0.2 })).toThrow(
    RangeError,
  );
});

test("worked example: escalation starts in year 2", () => {
  // E = 1000 kWh/yr at 0.5, +10 %/yr → 500, 550, 605; O&M 100, +10 %/yr → 100, 110, 121.
  const got = cashFlows({
    capitalCost: 1200,
    incentive: 200,
    energy: [1000, 1000, 1000],
    energyPrice: 0.5,
    priceEscalation: 0.1,
    omCost: 100,
    omEscalation: 0.1,
  });
  [-1000, 400, 440, 484].forEach((want, t) => {
    expect(got[t]).toBeCloseTo(want, 10);
  });
});
