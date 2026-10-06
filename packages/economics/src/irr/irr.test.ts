import { describe, expect, test } from "vitest";
import { irr } from "./irr.ts";
import fixtures from "./irr-fixtures.json" with { type: "json" };

/** Absolute, in rate units. Justification in irr.md → Reference. */
const TOLERANCE = 1e-12;

describe("irr vs numpy-financial", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    const got = irr(input);
    if (expected.irr === null) expect(got).toBeNaN();
    else expect(Math.abs(got - expected.irr)).toBeLessThan(TOLERANCE);
  });
});

test("numpy-financial docstring examples", () => {
  expect(irr({ cashFlows: [-100, 39, 59, 55, 20] })).toBeCloseTo(0.28095, 5);
  expect(irr({ cashFlows: [-5, 10.5, 1, -8, 1] })).toBeCloseTo(0.0886, 4); // closest of several
});
