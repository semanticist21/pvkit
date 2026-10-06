import { expect, test } from "vitest";
import { type DiscInput, disc } from "./disc.ts";
import fixtures from "./disc-fixtures.json" with { type: "json" };

/** W/m² (dni), dimensionless (kt, airmass). Justification in disc.md → Reference. */
const TOLERANCE = 1e-9;
const FIELDS = ["dni", "kt", "airmass"] as const;

test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
  const got = disc(input as DiscInput);
  for (const f of FIELDS) {
    const want = expected[f];
    if (want === null) expect(got[f], f).toBeNaN();
    else expect(Math.abs(got[f] - want), f).toBeLessThan(TOLERANCE);
  }
});

test("rejects a non-finite timeMs", () => {
  expect(() => disc({ ghi: 100, solarZenith: 30, timeMs: Number.POSITIVE_INFINITY })).toThrow(
    RangeError,
  );
});
