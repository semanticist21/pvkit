import { describe, expect, test } from "vitest";
import { soilingHsu } from "./soiling-hsu.ts";
import fixtures from "./soiling-hsu-fixtures.json" with { type: "json" };

/** Absolute, soiling ratio. Justification in soiling-hsu.md → Reference. */
const TOLERANCE = 1e-12;

describe("soilingHsu vs pvlib soiling.hsu (chained steps)", () => {
  test.each(fixtures.cases.map((c) => [c.name, c] as const))("%s", (_, c) => {
    let mass = 0;
    for (const [i, { input, expected }] of c.steps.entries()) {
      const got = soilingHsu({ ...input, prevAccumulatedMass: mass });
      expect(Math.abs(got.soilingRatio - expected.soilingRatio), `step ${i}`).toBeLessThan(
        TOLERANCE,
      );
      mass = got.accumulatedMass;
    }
  });
});

test("paper: SR floor 1 − 0.3437 ≈ 0.6563; ~0.6875 at the validated 10 g/m²", () => {
  const base = { rainfallAccumulated: 0, timestepMs: 0, cleaningThreshold: 1, surfaceTilt: 0 };
  const at = (m: number) => soilingHsu({ ...base, pm25: 0, pm10: 0, prevAccumulatedMass: m });
  expect(at(0).soilingRatio).toBe(1);
  expect(at(10).soilingRatio).toBeCloseTo(0.6875, 3);
  expect(at(1e6).soilingRatio).toBeCloseTo(0.6563, 15);
});

test("NaN window rainfall does not clean (pvlib: NaN >= threshold is false)", () => {
  const got = soilingHsu({
    rainfallAccumulated: Number.NaN,
    timestepMs: 3_600_000,
    cleaningThreshold: 1,
    surfaceTilt: 0,
    pm25: 0,
    pm10: 0,
    prevAccumulatedMass: 2,
  });
  expect(got.accumulatedMass).toBe(2);
});

test("rejects out-of-range inputs", () => {
  const ok = { rainfallAccumulated: 0, cleaningThreshold: 1, surfaceTilt: 0, pm25: 0, pm10: 0 };
  expect(() => soilingHsu({ ...ok, timestepMs: -1 })).toThrow(RangeError);
  expect(() => soilingHsu({ ...ok, timestepMs: Number.POSITIVE_INFINITY })).toThrow(RangeError);
  expect(() => soilingHsu({ ...ok, timestepMs: 1, pm25: -1 })).toThrow(RangeError);
  expect(() => soilingHsu({ ...ok, timestepMs: 1, prevAccumulatedMass: -1 })).toThrow(RangeError);
  expect(() => soilingHsu({ ...ok, timestepMs: 1, surfaceTilt: 95 })).toThrow(RangeError);
});
