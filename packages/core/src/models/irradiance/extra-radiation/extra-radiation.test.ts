import { expect, test } from "vitest";
import { type ExtraRadiationInput, extraRadiation } from "./extra-radiation.ts";
import fixtures from "./extra-radiation-fixtures.json" with { type: "json" };

/** W/m². Justification in extra-radiation.md → Reference. */
const TOLERANCE = 1e-9;

test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
  const got = extraRadiation(input as ExtraRadiationInput);
  expect(Math.abs(got - expected)).toBeLessThan(TOLERANCE);
});

test("defaults to spencer with 1366.1 W/m²", () => {
  const timeMs = Date.UTC(2025, 6, 4);
  expect(extraRadiation({ timeMs })).toBe(
    extraRadiation({ timeMs, method: "spencer", solarConstant: 1366.1 }),
  );
});

// 2025 perihelion 01-04 13:28 UTC at 147 103 686 km, aphelion 07-03 19:55 UTC at
// 152 087 738 km (JPL ephemeris; 1 AU = 149 597 870.7 km).
const AU_KM = 149_597_870.7;
test("nrel matches the published 2025 perihelion/aphelion distances", () => {
  const ratio = (timeMs: number) => extraRadiation({ timeMs, method: "nrel" }) / 1366.1;
  expect(ratio(Date.UTC(2025, 0, 4, 13, 28))).toBeCloseTo((AU_KM / 147_103_686) ** 2, 4);
  expect(ratio(Date.UTC(2025, 6, 3, 19, 55))).toBeCloseTo((AU_KM / 152_087_738) ** 2, 4);
});

test("rejects bad inputs", () => {
  expect(() => extraRadiation({ timeMs: Number.NaN })).toThrow(RangeError);
  expect(() =>
    extraRadiation({ timeMs: 0, method: "pyephem" } as unknown as ExtraRadiationInput),
  ).toThrow(RangeError);
});
