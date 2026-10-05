import { describe, expect, test } from "vitest";
import { type AirmassModel, relativeAirmass } from "./relative-airmass.ts";
import fixtures from "./relative-airmass-fixtures.json" with { type: "json" };

/** Relative error. Justification in relative-airmass.md → Reference. */
const TOLERANCE = 1e-12;

describe("relativeAirmass vs pvlib get_relative_airmass", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    const got = relativeAirmass({
      solarZenith: input.solarZenith,
      model: input.model as AirmassModel,
    });
    if (expected === null) {
      expect(got).toBeNaN();
      return;
    }
    expect(Math.abs(got - expected) / Math.abs(expected)).toBeLessThan(TOLERANCE);
  });
});

test("matches Kasten & Young (1989) horizon value", () => {
  // Eq. (3) at the horizon gives 37.92 (vs the paper's tabulated 38.0868).
  expect(relativeAirmass({ solarZenith: 90 })).toBeCloseTo(37.92, 2);
});

test("rejects an unknown model", () => {
  expect(() => relativeAirmass({ solarZenith: 30, model: "bogus" as AirmassModel })).toThrow(
    RangeError,
  );
});
