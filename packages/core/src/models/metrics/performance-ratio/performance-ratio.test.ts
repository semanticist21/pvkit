import { describe, expect, test } from "vitest";
import { irradianceWeightedTemperature, performanceRatio } from "./performance-ratio.ts";
import fixtures from "./performance-ratio-fixtures.json" with { type: "json" };

/** Relative. Justification in performance-ratio.md → Reference. */
const TOLERANCE = 1e-15;
const rel = (got: number, want: number) => Math.abs(got - want) / Math.max(1e-300, Math.abs(want));

describe("performanceRatio vs IEC 61724-1 / Dierauf formula", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    const got = performanceRatio(input);
    const want = expected.performanceRatio;
    if (want === null) expect(got).toBeNaN();
    else expect(want === 0 ? Math.abs(got) : rel(got, want)).toBeLessThan(TOLERANCE);
  });
});

test("hand-checkable examples", () => {
  // 800 kWh from 500 kWp under 2 kWh/m²: Y_f = 1.6 h, Y_r = 2 h.
  expect(performanceRatio({ energy: [800], poaIrradiation: [2], pdc0Kw: 500 })).toBeCloseTo(
    0.8,
    15,
  );
  // Hot interval (T > T_ref) lowers the expectation: 1 + (-0.004)(50 - 25) = 0.9.
  const pr = performanceRatio({
    energy: [0.72],
    poaIrradiation: [1],
    pdc0Kw: 1,
    tempCell: [50],
    gammaPdc: -0.004,
    tempRef: 25,
  });
  expect(pr).toBeCloseTo(0.8, 15);
});

test("Dierauf correction cancels when T_ref is the period's own weighted average", () => {
  const poaIrradiation = [0.1, 0.5, 0.9, 0.4];
  const tempCell = [12, 31, 48, 27];
  const energy = [0.08, 0.41, 0.66, 0.33];
  const tempRef = irradianceWeightedTemperature({ poaIrradiation, tempCell });
  expect(tempRef).toBeCloseTo((1.2 + 15.5 + 43.2 + 10.8) / 1.9, 12);
  const plain = performanceRatio({ energy, poaIrradiation, pdc0Kw: 1 });
  const corrected = performanceRatio({
    energy,
    poaIrradiation,
    pdc0Kw: 1,
    tempCell,
    gammaPdc: -0.0045,
    tempRef,
  });
  expect(rel(corrected, plain)).toBeLessThan(TOLERANCE);
});

test("rejects bad inputs", () => {
  const base = { energy: [1], poaIrradiation: [1], pdc0Kw: 1 };
  expect(() => performanceRatio({ ...base, pdc0Kw: 0 })).toThrow(RangeError);
  expect(() => performanceRatio({ ...base, pdc0Kw: Number.NaN })).toThrow(RangeError);
  expect(() => performanceRatio({ ...base, irradRef: -1 })).toThrow(RangeError);
  expect(() => performanceRatio({ ...base, gammaPdc: -0.004 })).toThrow(RangeError);
  expect(() => performanceRatio({ ...base, tempCell: [25] })).toThrow(RangeError);
  expect(() => performanceRatio({ ...base, tempRef: 25 })).toThrow(RangeError);
  expect(() =>
    performanceRatio({ ...base, tempCell: [25], gammaPdc: Number.NaN, tempRef: 25 }),
  ).toThrow(RangeError);
  expect(() =>
    performanceRatio({
      ...base,
      tempCell: [25],
      gammaPdc: -0.004,
      tempRef: Number.POSITIVE_INFINITY,
    }),
  ).toThrow(RangeError);
  expect(() =>
    performanceRatio({
      ...base,
      tempCell: [1, 2],
      gammaPdc: -0.004,
      tempRef: 25,
    }),
  ).toThrow(RangeError);
  expect(() => irradianceWeightedTemperature({ poaIrradiation: [1], tempCell: [1, 2] })).toThrow(
    RangeError,
  );
});

test("irradianceWeightedTemperature: Σ(H·T)/ΣH, NaN when ΣH = 0", () => {
  expect(irradianceWeightedTemperature({ poaIrradiation: [1, 3], tempCell: [20, 40] })).toBeCloseTo(
    35,
    12,
  );
  expect(irradianceWeightedTemperature({ poaIrradiation: [0, 0], tempCell: [20, 40] })).toBeNaN();
});
