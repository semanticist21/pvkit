import { describe, expect, test } from "vitest";
import { roi } from "./roi.ts";
import fixtures from "./roi-fixtures.json" with { type: "json" };

/** Relative (absolute where the expected value is 0). Justification in roi.md. */
const TOLERANCE = 1e-14;
const rel = (got: number, want: number) => Math.abs(got - want) / Math.max(1e-300, Math.abs(want));

describe("roi vs explicit formula", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    const got = roi(input);
    expect(expected.roi === 0 ? Math.abs(got) : rel(got, expected.roi)).toBeLessThan(TOLERANCE);
  });
});

test("hand-checkable example", () => {
  expect(roi({ cashFlows: [-1000, 600, 600] })).toBeCloseTo(0.2, 15);
});

test("rejects a non-negative or missing investment", () => {
  expect(() => roi({ cashFlows: [] })).toThrow(RangeError);
  expect(() => roi({ cashFlows: [0, 10] })).toThrow(RangeError);
});
