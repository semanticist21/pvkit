import { expect, test } from "vitest";
import { groundDiffuse } from "./ground-diffuse.ts";
import fixtures from "./ground-diffuse-fixtures.json" with { type: "json" };

/** Relative to max(1, |expected|) W/m². Justification in ../irradiance.md. */
const TOLERANCE = 1e-12;

/** Fixture JSON writes NaN/±Infinity as strings; those must match exactly. */
const check = (got: number, want: number | string) => {
  const w = Number(want);
  if (!Number.isFinite(w)) expect(got).toBe(w);
  else expect(Math.abs(got - w) / Math.max(1, Math.abs(w))).toBeLessThan(TOLERANCE);
};

test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
  check(groundDiffuse(input), expected);
});

test("albedo defaults to 0.25; flat panel sees no ground", () => {
  expect(groundDiffuse({ surfaceTilt: 0, ghi: 800 })).toBe(0);
  expect(Math.abs(groundDiffuse({ surfaceTilt: 90, ghi: 800 }) - 100)).toBeLessThan(1e-12);
});
