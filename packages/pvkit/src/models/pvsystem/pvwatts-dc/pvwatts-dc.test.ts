import { describe, expect, test } from "vitest";
import { pvwattsDc } from "./pvwatts-dc.ts";
import fixtures from "./pvwatts-dc-fixtures.json" with { type: "json" };

/** Relative to max(1, |expected|). Justification in pvwatts-dc.md → Reference. */
const TOLERANCE = 1e-14;

describe("pvwattsDc vs pvlib pvwatts_dc", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    const err = Math.abs(pvwattsDc(input) - expected.pdc) / Math.max(1, Math.abs(expected.pdc));
    expect(err).toBeLessThan(TOLERANCE);
  });
});

test("Dobos 2014 eq. 1: STC gives pdc0, +10 °C at γ = −0.5 %/°C gives −5 %", () => {
  expect(
    pvwattsDc({ effectiveIrradiance: 1000, tempCell: 25, pdc0: 4000, gammaPdc: -0.005 }),
  ).toBeCloseTo(4000, 9);
  expect(
    pvwattsDc({ effectiveIrradiance: 1000, tempCell: 35, pdc0: 4000, gammaPdc: -0.005 }),
  ).toBeCloseTo(3800, 9);
});

test("rejects negative or NaN pdc0", () => {
  expect(() => pvwattsDc({ effectiveIrradiance: 1, tempCell: 25, pdc0: -1, gammaPdc: 0 })).toThrow(
    RangeError,
  );
  expect(() =>
    pvwattsDc({ effectiveIrradiance: 1, tempCell: 25, pdc0: Number.NaN, gammaPdc: 0 }),
  ).toThrow(RangeError);
});
