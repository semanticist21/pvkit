import { describe, expect, test } from "vitest";
import { energyKwh } from "./energy-kwh.ts";
import fixtures from "./energy-kwh-fixtures.json" with { type: "json" };

/** Relative. Justification in energy-kwh.md → Reference. */
const TOLERANCE = 1e-15;
const rel = (got: number, want: number) => Math.abs(got - want) / Math.max(1e-300, Math.abs(want));

describe("energyKwh vs math.fsum", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    const got = energyKwh(input.powerW, input.stepHours);
    expect(expected.energyKwh === 0 ? Math.abs(got) : rel(got, expected.energyKwh)).toBeLessThan(
      TOLERANCE,
    );
  });
});

test("a year of minute data matches fsum (series regenerated from the xorshift32 spec)", () => {
  const { seed, n, scale, dayStart, dayEnd, stepHours, expected } = fixtures.meta.year;
  const power = new Float64Array(n);
  let x = seed;
  for (let i = 0; i < n; i++) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    const m = i % 1440;
    power[i] = m >= dayStart && m < dayEnd ? (x / 4294967296) * scale : 0;
  }
  expect(rel(energyKwh(power, stepHours), expected.energyKwh)).toBeLessThan(TOLERANCE);
  // A naive `+=` drifts past TOLERANCE on this series, so the test discriminates.
  expect(rel(fixtures.meta.year.naiveEnergyKwh, expected.energyKwh)).toBeGreaterThan(TOLERANCE);
});

test("rejects non-positive or non-finite stepHours", () => {
  expect(() => energyKwh([1], 0)).toThrow(RangeError);
  expect(() => energyKwh([1], Number.POSITIVE_INFINITY)).toThrow(RangeError);
  expect(() => energyKwh([1], Number.NaN)).toThrow(RangeError);
});
