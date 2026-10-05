import { describe, expect, test } from "vitest";
import { specificYield } from "./specific-yield.ts";
import fixtures from "./specific-yield-fixtures.json" with { type: "json" };

/** Relative. Justification in specific-yield.md → Reference. */
const TOLERANCE = 1e-15;
const rel = (got: number, want: number) => Math.abs(got - want) / Math.max(1e-300, Math.abs(want));

describe("specificYield vs IEC 61724-1 formula", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    const got = specificYield(input);
    const want = expected.specificYield;
    expect(want === 0 ? Math.abs(got) : rel(got, want)).toBeLessThan(TOLERANCE);
  });
});

test("hand-checkable example", () => {
  expect(specificYield({ energy: [400, 600], pdc0: 5 })).toBe(200);
});

test("rejects non-positive or non-finite pdc0", () => {
  expect(() => specificYield({ energy: [1], pdc0: 0 })).toThrow(RangeError);
  expect(() => specificYield({ energy: [1], pdc0: Number.POSITIVE_INFINITY })).toThrow(RangeError);
  expect(() => specificYield({ energy: [1], pdc0: Number.NaN })).toThrow(RangeError);
});
