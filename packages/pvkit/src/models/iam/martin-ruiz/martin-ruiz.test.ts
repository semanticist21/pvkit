import { expect, test } from "vitest";
import { martinRuiz } from "./martin-ruiz.ts";
import fixtures from "./martin-ruiz-fixtures.json" with { type: "json" };

/** Unitless. Justification in martin-ruiz.md → Reference. */
const TOLERANCE = 1e-12;

test.each(fixtures.cases.map((c, i) => [i, c] as const))("martinRuiz vs pvlib, case %i", (_, c) => {
  expect(Math.abs(martinRuiz(c.input) - c.expected)).toBeLessThan(TOLERANCE);
});

test("IAM(0) = 1, 0 at and beyond 90°, NaN passes through", () => {
  expect(martinRuiz({ aoi: 0 })).toBeCloseTo(1, 15);
  expect(martinRuiz({ aoi: 90 })).toBe(0);
  expect(martinRuiz({ aoi: Number.NaN })).toBeNaN();
});

test("rejects aR ≤ 0", () => {
  expect(() => martinRuiz({ aoi: 0, aR: 0 })).toThrow(RangeError);
  expect(() => martinRuiz({ aoi: 0, aR: -0.1 })).toThrow(RangeError);
  expect(() => martinRuiz({ aoi: 0, aR: Number.NaN })).toThrow(RangeError);
});
