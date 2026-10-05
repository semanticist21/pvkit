import { describe, expect, test } from "vitest";
import { sunriseGeometric } from "./sunrise-geometric.ts";
import fixtures from "./sunrise-geometric-fixtures.json" with { type: "json" };

/** Milliseconds. Justification in sunrise-geometric.md → Reference. */
const TOLERANCE = 1e-2;
const FIELDS = ["sunrise", "sunset", "transit"] as const;

describe("sunriseGeometric vs pvlib sun_rise_set_transit_geometric", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    const got = sunriseGeometric(input);
    for (const f of FIELDS) {
      const want = expected[f];
      if (want === null) expect(got[f], f).toBeNaN();
      else expect(Math.abs(got[f] - want), f).toBeLessThan(TOLERANCE);
    }
  });
});

test("equinox (δ = 0): 12 h day centred on transit, any latitude", () => {
  const got = sunriseGeometric({
    timeMs: Date.UTC(2025, 2, 20),
    latitude: 45,
    longitude: 0,
    declination: 0,
    equationOfTime: 0,
  });
  expect(Math.abs(got.transit - Date.UTC(2025, 2, 20, 12))).toBeLessThan(1e-3);
  expect(Math.abs(got.sunrise - Date.UTC(2025, 2, 20, 6))).toBeLessThan(1e-3);
  expect(Math.abs(got.sunset - Date.UTC(2025, 2, 20, 18))).toBeLessThan(1e-3);
});

test("rejects a non-finite time", () => {
  expect(() =>
    sunriseGeometric({
      timeMs: Number.NaN,
      latitude: 0,
      longitude: 0,
      declination: 0,
      equationOfTime: 0,
    }),
  ).toThrow(RangeError);
});
