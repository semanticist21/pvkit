import { describe, expect, test } from "vitest";
import { simplifiedSolis } from "./simplified-solis.ts";
import fixtures from "./simplified-solis-fixtures.json" with { type: "json" };

const FIELDS = ["ghi", "dni", "dhi"] as const;
/** W/m². Justification in simplified-solis.md → Reference. */
const TOLERANCE = 1e-10;

describe("simplifiedSolis vs pvlib", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    const got = simplifiedSolis(input);
    for (const f of FIELDS) expect(Math.abs(got[f] - expected[f]), f).toBeLessThan(TOLERANCE);
  });
});

test("pvlib defaults", () => {
  const explicit = simplifiedSolis({
    apparentElevation: 50,
    aod700: 0.1,
    precipitableWater: 1,
    pressure: 101_325,
    dniExtra: 1364,
  });
  expect(simplifiedSolis({ apparentElevation: 50 })).toEqual(explicit);
});

test("rejects out-of-range inputs", () => {
  expect(() => simplifiedSolis({ apparentElevation: 30, aod700: -0.1 })).toThrow(RangeError);
  expect(() => simplifiedSolis({ apparentElevation: 30, pressure: 0 })).toThrow(RangeError);
});
