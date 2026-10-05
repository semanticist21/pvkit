import { expect, test } from "vitest";
import { aoi, aoiProjection } from "./aoi.ts";
import fixtures from "./aoi-fixtures.json" with { type: "json" };

/** Degrees for aoi, unitless for aoiProjection. Justification in aoi.md → Reference. */
const TOLERANCE = 1e-9;

test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
  expect(Math.abs(aoiProjection(input) - expected.aoiProjection)).toBeLessThan(TOLERANCE);
  expect(Math.abs(aoi(input) - expected.aoi)).toBeLessThan(TOLERANCE);
});

test("sun normal to the panel → 0°, sun directly behind → 180°", () => {
  expect(aoi({ surfaceTilt: 30, surfaceAzimuth: 180, solarZenith: 30, solarAzimuth: 180 })).toBe(0);
  expect(aoi({ surfaceTilt: 0, surfaceAzimuth: 0, solarZenith: 180, solarAzimuth: 0 })).toBe(180);
});
