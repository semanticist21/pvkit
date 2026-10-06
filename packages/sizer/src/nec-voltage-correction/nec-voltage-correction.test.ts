import { expect, test } from "vitest";
import { necVoltageCorrection } from "./nec-voltage-correction.ts";
import fixtures from "./nec-voltage-correction-fixtures.json" with { type: "json" };

test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
  if (expected === null) expect(() => necVoltageCorrection(input.tempMin)).toThrow(RangeError);
  else expect(necVoltageCorrection(input.tempMin)).toBe(expected);
});
