import { describe, expect, test } from "vitest";
import { gueymard94Pw } from "./gueymard94-pw.ts";
import fixtures from "./gueymard94-pw-fixtures.json" with { type: "json" };

/** Relative error. Justification in gueymard94-pw.md → Reference. */
const TOLERANCE = 1e-12;

describe("gueymard94Pw vs pvlib gueymard94_pw", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    expect(Math.abs(gueymard94Pw(input) - expected) / expected).toBeLessThan(TOLERANCE);
  });
});

test("floors at 0.1 cm for dry air", () => {
  expect(gueymard94Pw({ tempAir: 0, relativeHumidity: 0 })).toBe(0.1);
});
