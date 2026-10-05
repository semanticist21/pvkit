import { describe, expect, test } from "vitest";
import { ineichen } from "./ineichen.ts";
import fixtures from "./ineichen-fixtures.json" with { type: "json" };

const FIELDS = ["ghi", "dni", "dhi"] as const;
/** W/m². Justification in ineichen.md → Reference. */
const TOLERANCE = 1e-10;

describe("ineichen vs pvlib", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    const got = ineichen(input);
    for (const f of FIELDS) expect(Math.abs(got[f] - expected[f]), f).toBeLessThan(TOLERANCE);
  });
});

test("NaN air mass (sun below horizon) yields zeros, as pvlib", () => {
  const got = ineichen({ apparentZenith: 95, airmassAbsolute: Number.NaN, linkeTurbidity: 3 });
  expect(got).toEqual({ ghi: 0, dni: 0, dhi: 0 });
});

test("NaN Linke turbidity propagates, as pvlib", () => {
  const got = ineichen({ apparentZenith: 30, airmassAbsolute: 1.15, linkeTurbidity: Number.NaN });
  for (const f of FIELDS) expect(got[f]).toBeNaN();
});

test("rejects out-of-range inputs", () => {
  expect(() => ineichen({ apparentZenith: 30, airmassAbsolute: 1, linkeTurbidity: 0 })).toThrow(
    RangeError,
  );
  expect(() => ineichen({ apparentZenith: 30, airmassAbsolute: -1, linkeTurbidity: 3 })).toThrow(
    RangeError,
  );
});

test("pvlib defaults", () => {
  const base = { apparentZenith: 40, airmassAbsolute: 1.3, linkeTurbidity: 3 };
  const explicit = ineichen({ ...base, altitude: 0, dniExtra: 1364, perezEnhancement: false });
  expect(ineichen(base)).toEqual(explicit);
});
