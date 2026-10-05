import { expect, test } from "vitest";
import { type DirindexInput, dirindex } from "./dirindex.ts";
import fixtures from "./dirindex-fixtures.json" with { type: "json" };

/** W/m². Justification in dirindex.md → Reference. */
const TOLERANCE = 1e-9;

test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
  const got = dirindex(input as DirindexInput);
  const want = expected.dni;
  if (want === null) expect(got).toBeNaN();
  else if (typeof want === "string")
    expect(got).toBe(Number(want)); // ±Infinity, as pvlib
  else expect(Math.abs(got - want)).toBeLessThan(TOLERANCE);
});

test("ghi equal to clear-sky GHI returns the clear-sky DNI", () => {
  const nb = { ghi: 700, ghiClearsky: 700, solarZenith: 35, timeMs: 0 };
  const got = dirindex({
    ghi: 720,
    ghiClearsky: 720,
    dniClearsky: 850,
    solarZenith: 34,
    timeMs: 3_600_000,
    previous: nb,
  });
  expect(got).toBeCloseTo(850, 9);
});
