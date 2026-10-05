import { describe, expect, test } from "vitest";
import { noctSam } from "./noct-sam.ts";
import fixtures from "./noct-sam-fixtures.json" with { type: "json" };

/** °C. Justification in noct-sam.md → Reference. */
const TOLERANCE = 1e-12;

describe("noctSam vs pvlib noct_sam", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    // JSON widens arrayHeight to number; fixtures only hold 1 or 2.
    const got = noctSam({ ...input, arrayHeight: input.arrayHeight as 1 | 2 });
    expect(Math.abs(got - expected.cellTemperature)).toBeLessThan(TOLERANCE);
  });
});

test("returns NOCT at NOCT conditions with zero efficiency (1 m/s at module height)", () => {
  // v′ = 0.51·WS = 1 m/s → wind loss 9.5/9.5; η = 0 → heat loss 1.
  const got = noctSam({
    poaGlobal: 800,
    tempAir: 20,
    windSpeed: 1 / 0.51,
    noct: 45,
    moduleEfficiency: 0,
  });
  expect(Math.abs(got - 45)).toBeLessThan(TOLERANCE);
});

test("mirrors pvlib for zero irradiance with effectiveIrradiance (0/0 → NaN)", () => {
  const base = { poaGlobal: 0, tempAir: 25, windSpeed: 1, noct: 45, moduleEfficiency: 0.2 };
  expect(noctSam({ ...base, effectiveIrradiance: 0 })).toBeNaN();
});

test("rejects arrayHeight other than 1 or 2", () => {
  const base = { poaGlobal: 800, tempAir: 20, windSpeed: 1, noct: 45, moduleEfficiency: 0.2 };
  expect(() => noctSam({ ...base, arrayHeight: 3 as 1 })).toThrow(RangeError);
});

test("optional inputs default to pvlib's (τα 0.9, arrayHeight 1, standoff 4 in)", () => {
  const base = { poaGlobal: 900, tempAir: 30, windSpeed: 3, noct: 46, moduleEfficiency: 0.2 };
  const explicit = noctSam({
    ...base,
    transmittanceAbsorptance: 0.9,
    arrayHeight: 1,
    mountStandoff: 4,
  });
  expect(noctSam(base)).toBe(explicit);
  expect(noctSam({ ...base, effectiveIrradiance: 900 })).toBe(explicit);
});
