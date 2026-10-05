import { describe, expect, test } from "vitest";
import { equationOfTimePvcdrom, equationOfTimeSpencer71 } from "./equation-of-time.ts";
import fixtures from "./equation-of-time-fixtures.json" with { type: "json" };

/** Minutes. Justification in equation-of-time.md → Reference. */
const TOLERANCE = 1e-12;

describe("equation of time vs pvlib", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    expect(Math.abs(equationOfTimeSpencer71(input) - expected.spencer71)).toBeLessThan(TOLERANCE);
    expect(Math.abs(equationOfTimePvcdrom(input) - expected.pvcdrom)).toBeLessThan(TOLERANCE);
  });
});

test("tracks the known annual extremes (≈ −14 min mid-Feb, ≈ +16 min early Nov)", () => {
  expect(equationOfTimeSpencer71({ dayOfYear: 42 })).toBeCloseTo(-14.2, 0);
  expect(equationOfTimeSpencer71({ dayOfYear: 307 })).toBeCloseTo(16.4, 0);
});
