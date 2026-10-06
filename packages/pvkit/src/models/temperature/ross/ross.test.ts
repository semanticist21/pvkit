import { describe, expect, test } from "vitest";
import { ross } from "./ross.ts";
import fixtures from "./ross-fixtures.json" with { type: "json" };

/** °C. Justification in ross.md → Reference. */
const TOLERANCE = 1e-12;

describe("ross vs pvlib ross(noct=...)", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    expect(Math.abs(ross(input) - expected.cellTemperature)).toBeLessThan(TOLERANCE);
  });
});

test("returns NOCT at NOCT conditions (800 W/m², 20 °C) — Ross 1981 definition", () => {
  expect(Math.abs(ross({ poaGlobal: 800, tempAir: 20, noct: 46.5 }) - 46.5)).toBeLessThan(
    TOLERANCE,
  );
});
