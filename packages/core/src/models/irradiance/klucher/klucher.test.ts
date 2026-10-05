import { expect, test } from "vitest";
import { klucher } from "./klucher.ts";
import fixtures from "./klucher-fixtures.json" with { type: "json" };

/** Relative to max(1, |expected|) W/m². Justification in ../irradiance.md. */
const TOLERANCE = 1e-12;

/** Fixture JSON writes NaN/±Infinity as strings; those must match exactly. */
const check = (got: number, want: number | string) => {
  const w = Number(want);
  if (!Number.isFinite(w)) expect(got).toBe(w);
  else expect(Math.abs(got - w) / Math.max(1, Math.abs(w))).toBeLessThan(TOLERANCE);
};

test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
  check(klucher(input), expected);
});

test("overcast (dhi = ghi) reduces to isotropic", () => {
  const got = klucher({
    surfaceTilt: 40,
    surfaceAzimuth: 180,
    dhi: 200,
    ghi: 200,
    solarZenith: 50,
    solarAzimuth: 180,
  });
  expect(Math.abs(got - 200 * 0.5 * (1 + Math.cos((40 * Math.PI) / 180)))).toBeLessThan(1e-12);
});
