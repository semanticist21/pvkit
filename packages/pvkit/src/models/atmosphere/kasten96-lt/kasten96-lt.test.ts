import { describe, expect, test } from "vitest";
import { kasten96Lt } from "./kasten96-lt.ts";
import fixtures from "./kasten96-lt-fixtures.json" with { type: "json" };

/** Relative error. Justification in kasten96-lt.md → Reference. */
const TOLERANCE = 1e-12;

describe("kasten96Lt vs pvlib kasten96_lt", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    expect(Math.abs(kasten96Lt(input) - expected) / expected).toBeLessThan(TOLERANCE);
  });
});

test("non-positive air mass is NaN, as pvlib", () => {
  expect(kasten96Lt({ airmassAbsolute: 0, precipitableWater: 1, aodBb: 0.1 })).toBeNaN();
  expect(kasten96Lt({ airmassAbsolute: -1, precipitableWater: 1, aodBb: 0.1 })).toBeNaN();
});
