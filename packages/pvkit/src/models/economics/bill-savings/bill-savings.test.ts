import { describe, expect, test } from "vitest";
import { billSavings } from "./bill-savings.ts";
import fixtures from "./bill-savings-fixtures.json" with { type: "json" };
import sam from "./bill-savings-sam-fixtures.json" with { type: "json" };

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
  expect(r).toMatchObject({ selfConsumption: 2, gridExport: 2, gridImport: 1 });
  expect(r.savings).toBeCloseTo(0.8, 15);
});

test("rejects mismatched lengths, negative or non-finite energy and non-finite prices", () => {
  expect(() =>
    billSavings({ production: [1, 2], load: [1], importPrice: 0.2, exportPrice: 0 }),
  ).toThrow(RangeError);
  expect(() =>
    billSavings({ production: [1], load: [1], importPrice: [0.2, 0.3], exportPrice: 0 }),
  ).toThrow(RangeError);
  expect(() =>
    billSavings({ production: [-1], load: [1], importPrice: 0.2, exportPrice: 0 }),
  ).toThrow(RangeError);
  expect(() =>
    billSavings({ production: [Infinity], load: [2], importPrice: 0.2, exportPrice: 0 }),
  ).toThrow(RangeError);
  expect(() =>
    billSavings({ production: [1], load: [1], importPrice: [Number.NaN], exportPrice: 0 }),
  ).toThrow(RangeError);
  expect(() =>
    billSavings({ production: [1], load: [1], importPrice: 0.2, exportPrice: Infinity }),
  ).toThrow(RangeError);
});

/** Relative. Justification in bill-savings.md → Reference. */
const SAM_TOLERANCE = 1e-12;
const year = (day: number[]) => Array.from({ length: 365 }, () => day).flat();

describe("billSavings vs NREL SAM net billing (year 1)", () => {
  test.each(sam.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    const { savings } = billSavings({
      production: year(input.productionDay),
      load: year(input.loadDay),
      importPrice: year(input.importPriceDay),
      exportPrice: year(input.exportPriceDay),
    });
    expect(rel(savings, expected.savings)).toBeLessThan(SAM_TOLERANCE);
  });
});

test("worked example: TOU prices apply per interval", () => {
  // hour 1: 2 kWh self-used at 0.2, 1 kWh exported at 0.05; hour 2 (peak): 1 kWh self-used
  // at 0.5, 3 kWh still bought → 0.4 + 0.05 + 0.5 = 0.95.
  const r = billSavings({
    production: [3, 1],
    load: [2, 4],
    importPrice: [0.2, 0.5],
    exportPrice: [0.05, 0.05],
  });
  expect(r).toMatchObject({ selfConsumption: 3, gridExport: 1, gridImport: 3 });
  expect(r.savings).toBeCloseTo(0.95, 15);
});
