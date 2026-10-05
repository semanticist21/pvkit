import { expect, test } from "vitest";
import { interp } from "./interp.ts";
import fixtures from "./interp-fixtures.json" with { type: "json" };

/** Unitless. Justification in interp.md → Reference. */
const TOLERANCE = 1e-12;

test.each(fixtures.cases.map((c, i) => [i, c] as const))("interp vs pvlib, case %i", (_, c) => {
  expect(Math.abs(interp(c.input) - c.expected)).toBeLessThan(TOLERANCE);
});

test("linear between points, sign of aoi ignored", () => {
  const ref = { thetaRef: [0, 30, 60, 90], iamRef: [1, 0.99, 0.9, 0] };
  expect(interp({ aoi: 45, ...ref })).toBeCloseTo(0.945, 15);
  expect(interp({ aoi: -45, ...ref })).toBeCloseTo(0.945, 15);
  expect(interp({ aoi: Number.NaN, ...ref })).toBeNaN();
});

test("rejects bad reference tables", () => {
  expect(() => interp({ aoi: 0, thetaRef: [0], iamRef: [1] })).toThrow(RangeError);
  expect(() => interp({ aoi: 0, thetaRef: [0, 90], iamRef: [1] })).toThrow(RangeError);
  expect(() => interp({ aoi: 0, thetaRef: [0, 0], iamRef: [1, 0] })).toThrow(RangeError);
  expect(() => interp({ aoi: 0, thetaRef: [90, 0], iamRef: [0, 1] })).toThrow(RangeError);
  expect(() => interp({ aoi: 0, thetaRef: [0, 90], iamRef: [1, -0.1] })).toThrow(RangeError);
});
