import { expect, test } from "vitest";
import { ashrae } from "./ashrae.ts";
import fixtures from "./ashrae-fixtures.json" with { type: "json" };

/** Unitless. Justification in ashrae.md → Reference. */
const TOLERANCE = 1e-12;

test.each(fixtures.cases.map((c, i) => [i, c] as const))("ashrae vs pvlib, case %i", (_, c) => {
  expect(Math.abs(ashrae(c.input) - c.expected)).toBeLessThan(TOLERANCE);
});

test("closed-form values and pvlib edge behaviour", () => {
  expect(ashrae({ aoi: 0 })).toBe(1);
  expect(ashrae({ aoi: 60 })).toBeCloseTo(0.95, 12); // sec 60° = 2
  expect(ashrae({ aoi: 90 })).toBe(0);
  expect(ashrae({ aoi: -90 })).toBe(0);
  expect(ashrae({ aoi: Number.NaN })).toBeNaN();
});
