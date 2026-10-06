import { expect, test } from "vitest";
import { type BolandInput, boland } from "./boland.ts";
import fixtures from "./boland-fixtures.json" with { type: "json" };

/** W/m² (dni, dhi), dimensionless (kt). Justification in boland.md → Reference. */
const TOLERANCE = 1e-9;
const FIELDS = ["dni", "dhi", "kt"] as const;

test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
  const got = boland(input as BolandInput);
  for (const f of FIELDS) expect(Math.abs(got[f] - expected[f]), f).toBeLessThan(TOLERANCE);
});

test("diffuse fraction is 1/2 at kt = b (logistic midpoint)", () => {
  const got = boland({ ghi: 613, solarZenith: 0, dniExtra: 1000 });
  expect(got.dhi / 613).toBeCloseTo(0.5, 12);
});

test("needs timeMs or dniExtra", () => {
  expect(() => boland({ ghi: 100, solarZenith: 30 })).toThrow(RangeError);
});
