import { describe, expect, test } from "vitest";
import { alt2pres, pres2alt } from "./altitude-pressure.ts";
import fixtures from "./altitude-pressure-fixtures.json" with { type: "json" };

/** Relative error. Justification in altitude-pressure.md → Reference. */
const TOLERANCE = 1e-12;
/** pres2alt: absolute error in metres (relative is meaningless near 0 m). */
const TOLERANCE_M = 1e-9;

describe("alt2pres vs pvlib", () => {
  test.each(fixtures.alt2pres.map((c, i) => [i, c] as const))(
    "case %i",
    (_, { input, expected }) => {
      expect(Math.abs(alt2pres(input) - expected) / expected).toBeLessThan(TOLERANCE);
    },
  );
});

describe("pres2alt vs pvlib", () => {
  test.each(fixtures.pres2alt.map((c, i) => [i, c] as const))(
    "case %i",
    (_, { input, expected }) => {
      expect(Math.abs(pres2alt(input) - expected)).toBeLessThan(TOLERANCE_M);
    },
  );
});

test("sea level is the standard atmosphere (101325 Pa)", () => {
  expect(alt2pres({ altitude: 0 })).toBeCloseTo(101_325, 0);
  expect(pres2alt({ pressure: 101_325 })).toBeCloseTo(0, 0);
});

test("edges of the standard atmosphere, as pvlib", () => {
  expect(alt2pres({ altitude: 44_331.514 })).toBe(0);
  expect(alt2pres({ altitude: 50_000 })).toBeNaN();
  expect(pres2alt({ pressure: 0 })).toBe(44_331.5);
  expect(pres2alt({ pressure: -1 })).toBeNaN();
});
