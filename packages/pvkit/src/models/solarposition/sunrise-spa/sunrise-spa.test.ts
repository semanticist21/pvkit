import { describe, expect, test } from "vitest";
import { sunriseSpa } from "./sunrise-spa.ts";
import fixtures from "./sunrise-spa-fixtures.json" with { type: "json" };

/** Milliseconds. Justification in sunrise-spa.md → Reference. */
const TOLERANCE = 1e-2;
const FIELDS = ["sunrise", "sunset", "transit"] as const;

describe("sunriseSpa vs pvlib sun_rise_set_transit_spa", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    const got = sunriseSpa(input);
    for (const f of FIELDS) {
      const want = expected[f];
      if (want === null) expect(got[f], f).toBeNaN();
      else expect(Math.abs(got[f] - want), f).toBeLessThan(TOLERANCE);
    }
  });
});

test("matches the published Reda & Andreas example (Table A5.1, MST = UTC−7)", () => {
  const got = sunriseSpa({
    timeMs: Date.UTC(2003, 9, 17),
    latitude: 39.742476,
    longitude: -105.1786,
    deltaT: 67,
  });
  const local = (h: number, m: number, s: number) => Date.UTC(2003, 9, 17, h + 7, m, s);
  // Published to the second: sunrise 06:12:43, transit 11:46:04, sunset 17:20:19.
  expect(Math.abs(got.sunrise - local(6, 12, 43))).toBeLessThan(1000);
  expect(Math.abs(got.transit - local(11, 46, 4))).toBeLessThan(1000);
  expect(Math.abs(got.sunset - local(17, 20, 19))).toBeLessThan(1000);
});

test("rejects out-of-range inputs", () => {
  expect(() => sunriseSpa({ timeMs: Number.NaN, latitude: 0, longitude: 0 })).toThrow(RangeError);
  expect(() => sunriseSpa({ timeMs: 0, latitude: -91, longitude: 0 })).toThrow(RangeError);
  expect(() => sunriseSpa({ timeMs: 0, latitude: 0, longitude: 181 })).toThrow(RangeError);
});
