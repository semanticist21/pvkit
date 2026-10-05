import { expect, test } from "vitest";
import { type TotalIrradianceInput, totalIrradiance } from "./total-irradiance.ts";
import fixtures from "./total-irradiance-fixtures.json" with { type: "json" };

/** Relative to max(1, |expected|) W/m². Justification in ../irradiance.md. */
const TOLERANCE = 1e-12;

test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
  // Fixture JSON writes NaN/±Infinity as strings.
  const inp =
    "airmassRelative" in input
      ? { ...input, airmassRelative: Number(input.airmassRelative) }
      : input;
  const got = totalIrradiance(inp as TotalIrradianceInput);
  for (const [k, v] of Object.entries(expected)) {
    const want = Number(v);
    const g = got[k as keyof typeof got];
    if (!Number.isFinite(want)) expect(g, k).toBe(want);
    else expect(Math.abs(g - want) / Math.max(1, Math.abs(want)), k).toBeLessThan(TOLERANCE);
  }
});

const base = {
  surfaceTilt: 30,
  surfaceAzimuth: 180,
  solarZenith: 40,
  solarAzimuth: 170,
  dni: 800,
  ghi: 750,
  dhi: 140,
};

test("defaults to the isotropic sky and albedo 0.25", () => {
  expect(totalIrradiance(base)).toEqual(
    totalIrradiance({ ...base, model: "isotropic", albedo: 0.25 }),
  );
});

test("rejects missing model inputs and unknown models", () => {
  const js = (x: unknown) => () => totalIrradiance(x as TotalIrradianceInput);
  expect(js({ ...base, model: "haydavies" })).toThrow(RangeError);
  expect(js({ ...base, model: "perez", dniExtra: 1366.1 })).toThrow(RangeError);
  expect(js({ ...base, model: "nope" })).toThrow(RangeError);
});
