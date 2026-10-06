import { describe, expect, test } from "vitest";
import { billSavings } from "./bill-savings.ts";
import fixtures from "./bill-savings-fixtures.json" with { type: "json" };

/** Relative (absolute where the expected value is 0). Justification in bill-savings.md. */
const TOLERANCE = 1e-14;
const rel = (got: number, want: number) => Math.abs(got - want) / Math.max(1e-300, Math.abs(want));

describe("billSavings vs explicit formula", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    const got = billSavings(input);
    for (const [k, want] of Object.entries(expected)) {
      const g = got[k as keyof typeof got];
      expect(want === 0 ? Math.abs(g) : rel(g, want)).toBeLessThan(TOLERANCE);
    }
  });
});

test("hand-checkable example", () => {
  const r = billSavings({ production: [3, 1], load: [1, 2], importPrice: 0.3, exportPrice: 0.1 });
  expect(r).toMatchObject({ selfConsumption: 2, export: 2, import: 1 });
  expect(r.savings).toBeCloseTo(0.8, 15);
});

test("rejects mismatched lengths and negative energy", () => {
  expect(() =>
    billSavings({ production: [1, 2], load: [1], importPrice: 0.2, exportPrice: 0 }),
  ).toThrow(RangeError);
  expect(() =>
    billSavings({ production: [1], load: [1], importPrice: [0.2, 0.3], exportPrice: 0 }),
  ).toThrow(RangeError);
  expect(() =>
    billSavings({ production: [-1], load: [1], importPrice: 0.2, exportPrice: 0 }),
  ).toThrow(RangeError);
});
