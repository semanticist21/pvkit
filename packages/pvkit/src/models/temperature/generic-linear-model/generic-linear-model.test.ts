import { describe, expect, test } from "vitest";
import {
  genericLinearFromFaiman,
  genericLinearFromNoctSam,
  genericLinearFromPvsyst,
  genericLinearFromSapm,
  genericLinearToFaiman,
  genericLinearToNoctSam,
  genericLinearToPvsyst,
  genericLinearToSapm,
} from "./generic-linear-model.ts";
import fixtures from "./generic-linear-model-fixtures.json" with { type: "json" };

/** Relative. Justification in generic-linear-model.md → Reference. */
const TOLERANCE = 1e-12;

const FNS: Record<string, (input: never) => object> = {
  genericLinearFromFaiman,
  genericLinearFromNoctSam,
  genericLinearFromPvsyst,
  genericLinearFromSapm,
  genericLinearToFaiman,
  genericLinearToNoctSam,
  genericLinearToPvsyst,
  genericLinearToSapm,
};

describe("conversions vs pvlib GenericLinearModel use_* / to_*", () => {
  test.each(fixtures.cases.map((c, i) => [`${i} ${c.fn}`, c] as const))(
    "case %s",
    (_, { fn, input, expected }) => {
      const got = (FNS[fn] as (i: unknown) => Record<string, number>)(input);
      for (const [k, v] of Object.entries(expected)) {
        const err = Math.abs((got[k] as number) - v) / Math.max(1, Math.abs(v));
        expect(err, k).toBeLessThan(TOLERANCE);
      }
    },
  );
});

test("reproduces the pvlib GenericLinearModel docstring example (η 0.19, α 0.88, Faiman 16/8)", () => {
  const glm = genericLinearFromFaiman({ u0: 16, u1: 8, moduleEfficiency: 0.19, absorptance: 0.88 });
  expect(Math.abs(glm.uConst - 11.04)).toBeLessThan(TOLERANCE);
  expect(Math.abs(glm.duWind - 5.52)).toBeLessThan(TOLERANCE);
  const pvsyst = genericLinearToPvsyst(glm);
  expect(Math.abs(pvsyst.uC - 11.4048)).toBeLessThan(TOLERANCE);
  expect(Math.abs(pvsyst.uV - 5.7024)).toBeLessThan(TOLERANCE);
});

test("round-trips every source model", () => {
  const m = { moduleEfficiency: 0.2, absorptance: 0.9 };
  const glm = { uConst: 12, duWind: 4, ...m };
  for (const back of [
    genericLinearFromFaiman({ ...genericLinearToFaiman(glm), ...m }),
    genericLinearFromPvsyst(genericLinearToPvsyst(glm)),
    genericLinearFromSapm({ ...genericLinearToSapm(glm), ...m }),
  ]) {
    expect(Math.abs(back.uConst - 12)).toBeLessThan(1e-12);
    expect(Math.abs(back.duWind - 4)).toBeLessThan(1e-12);
  }
  // NOCT keeps only u_noct = u_const + du_wind/0.51 and re-splits it 60/40.
  const noct = genericLinearFromNoctSam(genericLinearToNoctSam(glm));
  expect(Math.abs(noct.uConst + noct.duWind / 0.51 - (12 + 4 / 0.51))).toBeLessThan(1e-12);
});

test("rejects absorptance ≤ moduleEfficiency", () => {
  const bad = { uConst: 10, duWind: 3, moduleEfficiency: 0.9, absorptance: 0.9 };
  expect(() => genericLinearToFaiman(bad)).toThrow(RangeError);
  expect(() => genericLinearToPvsyst(bad)).toThrow(RangeError);
  expect(() => genericLinearToSapm(bad)).toThrow(RangeError);
  expect(() => genericLinearFromFaiman({ u0: 25, u1: 6.84, ...bad })).toThrow(RangeError);
});

test("SAPM conversion defaults windFitLow = 1.4, windFitHigh = 5.4 (pvlib)", () => {
  const p = { a: -3.47, b: -0.0594, moduleEfficiency: 0.19, absorptance: 0.88 };
  expect(genericLinearFromSapm(p)).toEqual(
    genericLinearFromSapm({ ...p, windFitLow: 1.4, windFitHigh: 5.4 }),
  );
});
