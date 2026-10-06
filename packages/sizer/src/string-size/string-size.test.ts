import { expect, test } from "vitest";
import { stringSize } from "./string-size.ts";
import fixtures from "./string-size-fixtures.json" with { type: "json" };

// Integer results of one IEEE division each, so they must match exactly.
test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
  expect(stringSize(input)).toEqual(expected);
});

test("rejects non-positive or non-finite limits", () => {
  const ok = { vocMax: 45, vmpMin: 28, imp: 9, vdcMax: 600, mpptLow: 200, idcMax: 18 };
  for (const key of ["vocMax", "vmpMin", "imp", "vdcMax", "idcMax"] as const) {
    expect(() => stringSize({ ...ok, [key]: 0 })).toThrow(RangeError);
    expect(() => stringSize({ ...ok, [key]: Number.NaN })).toThrow(RangeError);
  }
  expect(() => stringSize({ ...ok, mpptLow: -1 })).toThrow(RangeError);
});
