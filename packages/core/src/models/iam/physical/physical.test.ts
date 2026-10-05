import { expect, test } from "vitest";
import { physical } from "./physical.ts";
import fixtures from "./physical-fixtures.json" with { type: "json" };

/** Unitless. Justification in physical.md → Reference. */
const TOLERANCE = 1e-12;

test.each(fixtures.cases.map((c, i) => [i, c] as const))("physical vs pvlib, case %i", (_, c) => {
  expect(Math.abs(physical(c.input) - c.expected)).toBeLessThan(TOLERANCE);
});

test("IAM(0) = 1, 0 from behind, NaN passes through (pvlib behaviour)", () => {
  expect(physical({ aoi: 0 })).toBeCloseTo(1, 15);
  expect(physical({ aoi: 0, nAr: 1.29 })).toBeCloseTo(1, 15);
  expect(physical({ aoi: 120 })).toBe(0);
  expect(physical({ aoi: 120, n: 1 })).toBe(0);
  // pvlib only forces aoi ≥ 90 → 0 for n2 = 1; aoi ≤ −90 stays 0/0 = NaN there.
  expect(physical({ aoi: -120, n: 1 })).toBeNaN();
  expect(physical({ aoi: Number.NaN })).toBeNaN();
});
