import { describe, expect, test } from "vitest";
import { faiman } from "./faiman.ts";
import fixtures from "./faiman-fixtures.json" with { type: "json" };

/** °C. Justification in faiman.md → Reference. */
const TOLERANCE = 1e-12;

describe("faiman vs pvlib faiman", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    expect(Math.abs(faiman(input) - expected.moduleTemperature)).toBeLessThan(TOLERANCE);
  });
});

test("defaults are Faiman's fitted U0 = 25, U1 = 6.84 at 1 m/s", () => {
  expect(Math.abs(faiman({ poaGlobal: 1000, tempAir: 20 }) - (20 + 1000 / 31.84))).toBeLessThan(
    TOLERANCE,
  );
});
