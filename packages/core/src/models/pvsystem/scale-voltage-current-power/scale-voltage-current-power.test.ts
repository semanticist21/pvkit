import { describe, expect, test } from "vitest";
import { scaleVoltageCurrentPower } from "./scale-voltage-current-power.ts";
import fixtures from "./scale-voltage-current-power-fixtures.json" with { type: "json" };

const FIELDS = ["iMp", "vMp", "iSc", "vOc", "pMp"] as const;
/** Relative to max(1, |expected|). Justification in scale-voltage-current-power.md. */
const TOLERANCE = 1e-15;

describe("scaleVoltageCurrentPower vs pvlib scale_voltage_current_power", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    const got = scaleVoltageCurrentPower(input);
    for (const f of FIELDS) {
      const err = Math.abs(got[f] - expected[f]) / Math.max(1, Math.abs(expected[f]));
      expect(err, f).toBeLessThan(TOLERANCE);
    }
  });
});

test("defaults leave the point unchanged", () => {
  const p = { iMp: 9.5, vMp: 40, iSc: 10, vOc: 48, pMp: 380 };
  expect(scaleVoltageCurrentPower(p)).toEqual(p);
});
