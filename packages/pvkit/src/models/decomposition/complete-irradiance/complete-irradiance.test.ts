import { expect, test } from "vitest";
import { type CompleteIrradianceInput, completeIrradiance } from "./complete-irradiance.ts";
import fixtures from "./complete-irradiance-fixtures.json" with { type: "json" };

/** W/m². Justification in complete-irradiance.md → Reference. */
const TOLERANCE = 1e-9;
const FIELDS = ["ghi", "dhi", "dni"] as const;

test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
  const got = completeIrradiance(input as CompleteIrradianceInput);
  for (const f of FIELDS) {
    const want = expected[f];
    if (want === null) expect(got[f], f).toBeNaN();
    else expect(Math.abs(got[f] - want), f).toBeLessThan(TOLERANCE);
  }
});

test("rejects anything but exactly one missing component", () => {
  expect(() => completeIrradiance({ solarZenith: 30, ghi: 1 })).toThrow(RangeError);
  expect(() => completeIrradiance({ solarZenith: 30, ghi: 1, dhi: 1, dni: 1 })).toThrow(RangeError);
});
