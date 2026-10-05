import { describe, expect, test } from "vitest";
import { combineLossFactors } from "./combine-loss-factors.ts";
import fixtures from "./combine-loss-factors-fixtures.json" with { type: "json" };

/** Absolute, fraction. Justification in combine-loss-factors.md → Reference. */
const TOLERANCE = 1e-15;

describe("combineLossFactors vs pvlib pvsystem.combine_loss_factors", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    expect(Math.abs(combineLossFactors(input) - expected)).toBeLessThan(TOLERANCE);
  });
});

test("typed arrays work and match the hand value", () => {
  expect(combineLossFactors(new Float64Array([0.02, 0.03]))).toBeCloseTo(0.0494, 15);
});
