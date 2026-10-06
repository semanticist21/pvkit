import { expect, test } from "vitest";
import { shadedFraction1d } from "./shaded-fraction1d.ts";
import fixtures from "./shaded-fraction1d-fixtures.json" with { type: "json" };

/** Fraction. Justification in shaded-fraction1d.md → Reference. */
const TOLERANCE = 1e-12;

test.each(fixtures.map((c, i) => [i, c] as const))("matches pvlib, case %i", (_, c) => {
  const { expected, shadingRowRotation, ...rest } = c;
  const got = shadedFraction1d({
    ...rest,
    ...(shadingRowRotation === null ? {} : { shadingRowRotation }),
  });
  expect(Math.abs(got - (expected ?? Number.NaN))).toBeLessThanOrEqual(TOLERANCE);
});

test("fixture set exercises partial shade, not only the 0/1 clamps", () => {
  expect(fixtures.filter((c) => c.expected !== 0 && c.expected !== 1).length).toBeGreaterThan(100);
});
