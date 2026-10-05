import { describe, expect, test } from "vitest";
import { angstromAlpha, angstromAodAtLambda } from "./angstrom.ts";
import fixtures from "./angstrom-fixtures.json" with { type: "json" };

/** Absolute error (AOD ≤ ~10, α ≤ ~3). Justification in angstrom.md → Reference. */
const TOLERANCE = 1e-12;

describe("angstromAodAtLambda vs pvlib", () => {
  test.each(fixtures.angstromAodAtLambda.map((c, i) => [i, c] as const))(
    "case %i",
    (_, { input, expected }) => {
      expect(Math.abs(angstromAodAtLambda(input) - expected)).toBeLessThan(TOLERANCE);
    },
  );
});

describe("angstromAlpha vs pvlib", () => {
  test.each(fixtures.angstromAlpha.map((c, i) => [i, c] as const))(
    "case %i",
    (_, { input, expected }) => {
      expect(Math.abs(angstromAlpha(input) - expected)).toBeLessThan(TOLERANCE);
    },
  );
});

test("alpha and aod-at-lambda invert each other", () => {
  const aod2 = angstromAodAtLambda({ aod0: 0.3, lambda0: 440, alpha: 1.4, lambda1: 870 });
  expect(angstromAlpha({ aod1: 0.3, lambda1: 440, aod2, lambda2: 870 })).toBeCloseTo(1.4, 12);
});

test("equal wavelengths give -Infinity / NaN, as pvlib", () => {
  expect(angstromAlpha({ aod1: 0.2, lambda1: 500, aod2: 0.1, lambda2: 500 })).toBe(-Infinity);
  expect(angstromAlpha({ aod1: 0.1, lambda1: 500, aod2: 0.1, lambda2: 500 })).toBeNaN();
});

test("defaults alpha = 1.14, lambda1 = 700 match pvlib", () => {
  // pvlib.atmosphere.angstrom_aod_at_lambda(0.1, 500) with its defaults
  expect(
    Math.abs(angstromAodAtLambda({ aod0: 0.1, lambda0: 500 }) - 0.06814186869746645),
  ).toBeLessThan(1e-15);
});
