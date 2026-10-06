import { describe, expect, test } from "vitest";
import { lifetimeEnergy } from "./lifetime-energy.ts";
import fixtures from "./lifetime-energy-fixtures.json" with { type: "json" };

/** Relative. Justification in lifetime-energy.md → Reference. */
const TOLERANCE = 1e-14;
const rel = (got: number, want: number) => Math.abs(got - want) / Math.max(1e-300, Math.abs(want));

describe("lifetimeEnergy vs explicit formula", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    const got = lifetimeEnergy(input);
    expect(got.annual).toHaveLength(expected.annual.length);
    got.annual.forEach((v, t) => {
      expect(rel(v, expected.annual[t] as number)).toBeLessThan(TOLERANCE);
    });
    expect(rel(got.total, expected.total)).toBeLessThan(TOLERANCE);
  });
});

test("hand-checkable example", () => {
  const { annual, total } = lifetimeEnergy({
    firstYearEnergy: 1000,
    degradationRate: 0.005,
    years: 2,
  });
  expect(annual[1]).toBeCloseTo(995, 12);
  expect(total).toBeCloseTo(1995, 12);
});

test("rejects bad degradationRate / years", () => {
  const ok = { firstYearEnergy: 1, degradationRate: 0, years: 1 };
  expect(() => lifetimeEnergy({ ...ok, degradationRate: 1 })).toThrow(RangeError);
  expect(() => lifetimeEnergy({ ...ok, years: 2.5 })).toThrow(RangeError);
  expect(() => lifetimeEnergy({ ...ok, years: -1 })).toThrow(RangeError);
  expect(() => lifetimeEnergy({ ...ok, firstYearEnergy: Number.NaN })).toThrow(RangeError);
});
