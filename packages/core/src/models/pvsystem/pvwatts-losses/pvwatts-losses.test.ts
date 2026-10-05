import { describe, expect, test } from "vitest";
import { pvwattsLosses } from "./pvwatts-losses.ts";
import fixtures from "./pvwatts-losses-fixtures.json" with { type: "json" };

/** Absolute, fraction. Justification in pvwatts-losses.md → Reference. */
const TOLERANCE = 1e-15;

describe("pvwattsLosses vs pvlib pvwatts_losses", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    expect(Math.abs(pvwattsLosses(input) - expected.losses)).toBeLessThan(TOLERANCE);
  });
});

test("defaults give the PVWatts V5 default of 14.08 % (Dobos 2014, Table 3)", () => {
  expect(pvwattsLosses()).toBeCloseTo(0.1408, 4);
});
