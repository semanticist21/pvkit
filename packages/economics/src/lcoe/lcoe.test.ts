import { describe, expect, test } from "vitest";
import { lcoe } from "./lcoe.ts";
import fixtures from "./lcoe-fixtures.json" with { type: "json" };
import sam from "./lcoe-sam-fixtures.json" with { type: "json" };

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

test("rejects mismatched lengths, non-finite values, no energy and discountRate ≤ -1", () => {
  expect(() => lcoe({ costs: [1], energy: [0, 1], discountRate: 0 })).toThrow(RangeError);
  expect(() => lcoe({ costs: [1], energy: [1], discountRate: -2 })).toThrow(RangeError);
  expect(() => lcoe({ costs: [1, Number.NaN], energy: [0, 1], discountRate: 0 })).toThrow(
    RangeError,
  );
  // no discounted energy to levelize over
  expect(() => lcoe({ costs: [100, 1], energy: [0, 0], discountRate: 0.05 })).toThrow(RangeError);
  expect(() => lcoe({ costs: [], energy: [], discountRate: 0.05 })).toThrow(RangeError);
});

/** Relative. Justification in lcoe.md → Reference. */
const SAM_TOLERANCE = 1e-12;

describe("lcoe vs NREL SAM Lcoefcr (FCR = capital recovery factor)", () => {
  test.each(sam.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    const { capitalCost, omCost, annualEnergy, discountRate, years } = input;
    const got = lcoe({
      costs: [capitalCost, ...Array<number>(years).fill(omCost)],
      energy: [0, ...Array<number>(years).fill(annualEnergy)],
      discountRate,
    });
    expect(rel(got, expected.lcoe)).toBeLessThan(SAM_TOLERANCE);
  });
});
