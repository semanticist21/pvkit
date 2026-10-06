import { describe, expect, test } from "vitest";
import { genericLinear } from "./generic-linear.ts";
import fixtures from "./generic-linear-fixtures.json" with { type: "json" };

/** °C. Justification in generic-linear.md → Reference. */
const TOLERANCE = 1e-12;

describe("genericLinear vs pvlib generic_linear", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    expect(Math.abs(genericLinear(input) - expected.moduleTemperature)).toBeLessThan(TOLERANCE);
  });
});
