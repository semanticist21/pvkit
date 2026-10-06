import { describe, expect, test } from "vitest";
import { soilingKimber } from "./soiling-kimber.ts";
import fixtures from "./soiling-kimber-fixtures.json" with { type: "json" };

/** Absolute, fraction of energy lost. Justification in soiling-kimber.md → Reference. */
const TOLERANCE = 1e-12;

describe("soilingKimber vs pvlib soiling.kimber (chained steps)", () => {
  test.each(fixtures.cases.map((c) => [c.name, c] as const))("%s", (_, c) => {
    let state = { accumulatedSoiling: c.initialSoiling, timeSinceRainMs: Number.POSITIVE_INFINITY };
    for (const [i, { input, expected }] of c.steps.entries()) {
      const got = soilingKimber({
        ...c.params,
        ...input,
        prevAccumulatedSoiling: state.accumulatedSoiling,
        prevTimeSinceRainMs: state.timeSinceRainMs,
      });
      expect(Math.abs(got.soilingLoss - expected.soilingLoss), `step ${i}`).toBeLessThan(TOLERANCE);
      state = got;
    }
  });
});

test("one dry day adds one day of soiling; a wash resets it", () => {
  const day = 86_400_000;
  const got = soilingKimber({
    rainfallAccumulated: 0,
    timestepMs: day,
    prevAccumulatedSoiling: 0.01,
  });
  expect(got.soilingLoss).toBeCloseTo(0.0115, 15);
  expect(got.timeSinceRainMs).toBe(Number.POSITIVE_INFINITY);
  const washed = soilingKimber({ rainfallAccumulated: 0, timestepMs: day, manualWash: true });
  expect(washed.soilingLoss).toBe(0);
});

test("rejects out-of-range inputs", () => {
  expect(() => soilingKimber({ rainfallAccumulated: 0, timestepMs: -1 })).toThrow(RangeError);
  expect(() => soilingKimber({ rainfallAccumulated: 0, timestepMs: Number.NaN })).toThrow(
    RangeError,
  );
  expect(() =>
    soilingKimber({ rainfallAccumulated: 0, timestepMs: 1, prevTimeSinceRainMs: -1 }),
  ).toThrow(RangeError);
});
