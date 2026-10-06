import { expect, test } from "vitest";
import { voltageAtTemperature } from "./voltage-at-temperature.ts";
import fixtures from "./voltage-at-temperature-fixtures.json" with { type: "json" };

/** Relative to max(1, |V|). Justification in voltage-at-temperature.md → Reference. */
const TOLERANCE = 1e-14;

test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
  const err = Math.abs(voltageAtTemperature(input) - expected) / Math.max(1, Math.abs(expected));
  expect(err).toBeLessThan(TOLERANCE);
});

test("tempRef defaults to 25 °C", () => {
  expect(voltageAtTemperature({ voltage: 40, beta: -0.1, tempCell: 25 })).toBe(40);
});
