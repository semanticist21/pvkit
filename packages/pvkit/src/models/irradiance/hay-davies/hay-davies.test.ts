import { expect, test } from "vitest";
import { hayDavies } from "./hay-davies.ts";
import fixtures from "./hay-davies-fixtures.json" with { type: "json" };

/** Relative to max(1, |expected|) W/m². Justification in ../irradiance.md. */
const TOLERANCE = 1e-12;

/** Fixture JSON writes NaN/±Infinity as strings; those must match exactly. */
const check = (got: number, want: number | string) => {
  const w = Number(want);
  if (!Number.isFinite(w)) expect(got).toBe(w);
  else expect(Math.abs(got - w) / Math.max(1, Math.abs(w))).toBeLessThan(TOLERANCE);
};

test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
  check(hayDavies(input), expected);
});
