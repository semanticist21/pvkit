import { describe, expect, test } from "vitest";
import { birdHulstrom80AodBb } from "./bird-hulstrom80-aod-bb.ts";
import fixtures from "./bird-hulstrom80-aod-bb-fixtures.json" with { type: "json" };

/** Absolute error (AOD ≤ ~1.1). Justification in bird-hulstrom80-aod-bb.md → Reference. */
const TOLERANCE = 1e-15;

describe("birdHulstrom80AodBb vs pvlib bird_hulstrom80_aod_bb", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    expect(Math.abs(birdHulstrom80AodBb(input) - expected)).toBeLessThan(TOLERANCE);
  });
});
