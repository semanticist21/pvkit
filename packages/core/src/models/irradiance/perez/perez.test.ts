import { expect, test } from "vitest";
import { type PerezModel, perez } from "./perez.ts";
import fixtures from "./perez-fixtures.json" with { type: "json" };

/** Relative to max(1, |expected|) W/m². Justification in ../irradiance.md. */
const TOLERANCE = 1e-12;

/** Fixture JSON writes NaN/±Infinity as strings; those must match exactly. */
const check = (got: number, want: number | string) => {
  const w = Number(want);
  if (!Number.isFinite(w)) expect(got).toBe(w);
  else expect(Math.abs(got - w) / Math.max(1, Math.abs(w))).toBeLessThan(TOLERANCE);
};

test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
  const got = perez({
    ...input,
    airmassRelative: Number(input.airmassRelative),
    model: input.model as PerezModel,
  });
  check(got, expected);
});

const base = {
  surfaceTilt: 30,
  surfaceAzimuth: 180,
  dhi: 100,
  dni: 600,
  dniExtra: 1366.1,
  solarZenith: 40,
  solarAzimuth: 180,
  airmassRelative: 1.3,
};

test("sun below horizon (airmass NaN) → 0; dhi = dni = 0 → NaN, as pvlib", () => {
  expect(perez({ ...base, airmassRelative: Number.NaN })).toBe(0);
  expect(perez({ ...base, dhi: 0, dni: 0 })).toBeNaN();
});

test("rejects an unknown coefficient set", () => {
  expect(() => perez({ ...base, model: "nope" as PerezModel })).toThrow(RangeError);
  expect(() => perez({ ...base, model: "toString" as PerezModel })).toThrow(RangeError);
});
