import { expect, test } from "vitest";
import { haurwitz } from "./haurwitz.ts";
import fixtures from "./haurwitz-fixtures.json" with { type: "json" };

/** W/m². Justification in haurwitz.md → Reference. */
const TOLERANCE = 1e-10;

test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i vs pvlib", (_, c) => {
  expect(Math.abs(haurwitz(c.input) - c.expected.ghi)).toBeLessThan(TOLERANCE);
});

test("0 at night and for NaN zenith (pvlib)", () => {
  expect(haurwitz({ apparentZenith: 90.5 })).toBe(0);
  expect(haurwitz({ apparentZenith: Number.NaN })).toBe(0);
});
