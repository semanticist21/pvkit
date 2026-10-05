import { expect, test } from "vitest";
import { type ErbsInput, erbs } from "./erbs.ts";
import fixtures from "./erbs-fixtures.json" with { type: "json" };

/** W/m² (dni, dhi), dimensionless (kt). Justification in erbs.md → Reference. */
const TOLERANCE = 1e-9;
const FIELDS = ["dni", "dhi", "kt"] as const;

test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
  const got = erbs(input as ErbsInput);
  for (const f of FIELDS) expect(Math.abs(got[f] - expected[f]), f).toBeLessThan(TOLERANCE);
});

test("Erbs et al. (1982) Eq. 1 diffuse fraction at kt = 0.5", () => {
  // kt = 0.5 → Kd = 0.9511 − 0.0802 + 1.097 − 2.07975 + 0.771 = 0.65915
  const dniExtra = 1000;
  const got = erbs({ ghi: 500, solarZenith: 0, dniExtra });
  expect(got.kt).toBeCloseTo(0.5, 12);
  expect(got.dhi / 500).toBeCloseTo(0.65915, 12);
});

test("needs timeMs or dniExtra, finite", () => {
  expect(() => erbs({ ghi: 100, solarZenith: 30 })).toThrow(RangeError);
  expect(() => erbs({ ghi: 100, solarZenith: 30, timeMs: Number.NaN })).toThrow(RangeError);
});

test("NaN dniExtra propagates NaN instead of inventing a split (pvlib behaviour)", () => {
  const got = erbs({ ghi: 500, solarZenith: 30, dniExtra: Number.NaN });
  expect(got.dhi).toBeNaN();
  expect(got.dni).toBeNaN();
});
