import { describe, expect, test } from "vitest";
import { absoluteAirmass } from "./absolute-airmass.ts";
import fixtures from "./absolute-airmass-fixtures.json" with { type: "json" };

/** Absolute error (air mass ≤ ~41). Justification in absolute-airmass.md → Reference. */
const TOLERANCE = 1e-12;

describe("absoluteAirmass vs pvlib get_absolute_airmass", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    expect(Math.abs(absoluteAirmass(input) - expected)).toBeLessThan(TOLERANCE);
  });
});

test("defaults to sea-level pressure", () => {
  expect(absoluteAirmass({ airmassRelative: 1.5 })).toBeCloseTo(1.5, 15);
});
