import { describe, expect, test } from "vitest";
import { pvsystCell } from "./pvsyst-cell.ts";
import fixtures from "./pvsyst-cell-fixtures.json" with { type: "json" };
import { PVSYST_TEMPERATURE_PARAMETERS } from "./pvsyst-cell-parameters.ts";

/** °C. Justification in pvsyst-cell.md → Reference. */
const TOLERANCE = 1e-12;

describe("pvsystCell vs pvlib pvsyst_cell", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    expect(Math.abs(pvsystCell(input) - expected.cellTemperature)).toBeLessThan(TOLERANCE);
  });
});

test("defaults are the freestanding preset at 1 m/s, ηm 0.1, α 0.9", () => {
  const base = { poaGlobal: 1000, tempAir: 20 };
  // 20 + 1000·0.9·0.9 / 29
  expect(Math.abs(pvsystCell(base) - (20 + 810 / 29))).toBeLessThan(TOLERANCE);
  const preset = pvsystCell({ ...base, ...PVSYST_TEMPERATURE_PARAMETERS.freestanding });
  expect(Math.abs(preset - pvsystCell(base))).toBeLessThan(TOLERANCE);
});
