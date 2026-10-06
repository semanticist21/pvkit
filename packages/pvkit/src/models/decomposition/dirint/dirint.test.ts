import { expect, test } from "vitest";
import { type DirintInput, dirint } from "./dirint.ts";
import fixtures from "./dirint-fixtures.json" with { type: "json" };

/** W/m². Justification in dirint.md → Reference. */
const TOLERANCE = 1e-9;

test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
  const got = dirint(input as DirintInput);
  if (expected.dni === null) expect(got).toBeNaN();
  else expect(Math.abs(got - expected.dni)).toBeLessThan(TOLERANCE);
});

test("no neighbours with useDeltaKtPrime → NaN (pvlib single-sample behaviour)", () => {
  expect(dirint({ ghi: 500, solarZenith: 30, timeMs: 0 })).toBeNaN();
  expect(dirint({ ghi: 500, solarZenith: 30, timeMs: 0, useDeltaKtPrime: false })).toBeGreaterThan(
    0,
  );
});

test("rejects a non-finite timeMs", () => {
  expect(() => dirint({ ghi: 1, solarZenith: 30, timeMs: Number.NaN })).toThrow(RangeError);
});
