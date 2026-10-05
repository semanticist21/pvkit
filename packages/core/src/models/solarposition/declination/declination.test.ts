import { describe, expect, test } from "vitest";
import { declinationCooper69, declinationSpencer71 } from "./declination.ts";
import fixtures from "./declination-fixtures.json" with { type: "json" };

/** Degrees. Justification in declination.md → Reference. */
const TOLERANCE = 1e-12;

describe("declination vs pvlib", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    expect(Math.abs(declinationSpencer71(input) - expected.spencer71)).toBeLessThan(TOLERANCE);
    expect(Math.abs(declinationCooper69(input) - expected.cooper69)).toBeLessThan(TOLERANCE);
  });
});

test("Cooper (1969): δ = 23.45° at n = 172 (Duffie & Beckman)", () => {
  // sin(2π·456/365) = sin(2π·91/365) ≈ 0.99996
  expect(declinationCooper69({ dayOfYear: 172 })).toBeCloseTo(23.45, 2);
  expect(declinationSpencer71({ dayOfYear: 172 })).toBeCloseTo(23.45, 1);
});
