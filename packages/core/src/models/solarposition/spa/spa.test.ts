import { describe, expect, test } from "vitest";
import { spa } from "./spa.ts";
import fixtures from "./spa-fixtures.json" with { type: "json" };

type Field = keyof ReturnType<typeof spa>;
const FIELDS: readonly Field[] = [
  "zenith",
  "apparentZenith",
  "elevation",
  "apparentElevation",
  "azimuth",
  "equationOfTime",
];

/** Degrees (minutes for equationOfTime). Justification in spa.md → Reference. */
const TOLERANCE = 1e-9;

describe("spa vs pvlib spa_python", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    const got = spa(input);
    for (const f of FIELDS) {
      const err = Math.abs(got[f] - expected[f]);
      // azimuth wraps at 0/360
      const wrapped = f === "azimuth" ? Math.min(err, 360 - err) : err;
      expect(wrapped, f).toBeLessThan(TOLERANCE);
    }
  });
});

test("matches the published Reda & Andreas example (Table A5.1)", () => {
  const got = spa({
    timeMs: Date.UTC(2003, 9, 17, 19, 30, 30),
    latitude: 39.742476,
    longitude: -105.1786,
    elevation: 1830.14,
    pressure: 82_000,
    temperature: 11,
    deltaT: 67,
  });
  expect(got.apparentZenith).toBeCloseTo(50.11162, 5);
  expect(got.azimuth).toBeCloseTo(194.34024, 5);
});

test("rejects out-of-range inputs", () => {
  expect(() => spa({ timeMs: Number.NaN, latitude: 0, longitude: 0 })).toThrow(RangeError);
  expect(() => spa({ timeMs: 0, latitude: 91, longitude: 0 })).toThrow(RangeError);
  expect(() => spa({ timeMs: 0, latitude: 0, longitude: 180.5 })).toThrow(RangeError);
});
