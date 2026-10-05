import { expect, test } from "vitest";
import { sapm } from "./sapm.ts";
import fixtures from "./sapm-fixtures.json" with { type: "json" };

/** Unitless. Justification in sapm.md → Reference. */
const TOLERANCE = 1e-12;

test.each(fixtures.cases.map((c, i) => [i, c] as const))("sapm vs pvlib, case %i", (_, c) => {
  expect(Math.abs(sapm(c.input) - c.expected)).toBeLessThan(TOLERANCE);
});

test("negative aoi → 0, upper clips, NaN passes through", () => {
  const b = { b0: 1, b1: 0.01, b2: 0, b3: 0, b4: 0, b5: 0 };
  expect(sapm({ aoi: -1, ...b })).toBe(0);
  expect(sapm({ aoi: 10, ...b })).toBeCloseTo(1.1, 15);
  expect(sapm({ aoi: 10, ...b, upper: 1 })).toBe(1);
  expect(sapm({ aoi: Number.NaN, ...b })).toBeNaN();
});
