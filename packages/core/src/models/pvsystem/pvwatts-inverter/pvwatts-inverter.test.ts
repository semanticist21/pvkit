import { describe, expect, test } from "vitest";
import { pvwattsInverter } from "./pvwatts-inverter.ts";
import fixtures from "./pvwatts-inverter-fixtures.json" with { type: "json" };

/** Relative to max(1, |expected|). Justification in pvwatts-inverter.md → Reference. */
const TOLERANCE = 1e-14;

describe("pvwattsInverter vs pvlib inverter.pvwatts", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    const err =
      Math.abs(pvwattsInverter(input) - expected.pac) / Math.max(1, Math.abs(expected.pac));
    expect(err).toBeLessThan(TOLERANCE);
  });
});

test("clips at pac0 = etaInvNom·pdc0; efficiency at pdc = pdc0 is etaInvNom (Dobos 2014)", () => {
  expect(pvwattsInverter({ pdc: 1e5, pdc0: 5000 })).toBeCloseTo(4800, 9);
  // η(ζ=1) = ηnom/ηref · 0.9637 = ηnom
  expect(pvwattsInverter({ pdc: 4000, pdc0: 4000, etaInvNom: 0.97 })).toBeCloseTo(0.97 * 4000, 9);
});

test("rejects non-positive pdc0", () => {
  expect(() => pvwattsInverter({ pdc: 1, pdc0: 0 })).toThrow(RangeError);
  expect(() => pvwattsInverter({ pdc: 1, pdc0: Number.NaN })).toThrow(RangeError);
});
