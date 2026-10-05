import { describe, expect, test } from "vitest";
import { fuentes } from "./fuentes.ts";
import fixtures from "./fuentes-fixtures.json" with { type: "json" };

/** °C. Justification in fuentes.md → Reference. */
const TOLERANCE = 1e-12;

describe("fuentes vs pvlib fuentes (per step, pvlib prior state)", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    expect(Math.abs(fuentes(input) - expected.moduleTemperature)).toBeLessThan(TOLERANCE);
  });
});

test("chained over each series (own prior state) stays within tolerance of pvlib", () => {
  let series = -1;
  let prev = 0;
  for (const { series: s, input, expected } of fixtures.cases) {
    const prevTempModule = s === series ? prev : input.prevTempModule;
    series = s;
    prev = fuentes({ ...input, prevTempModule });
    expect(Math.abs(prev - expected.moduleTemperature)).toBeLessThan(TOLERANCE);
  }
});

test("settles at installed NOCT under NOCT conditions (Fuentes 1987 calibration)", () => {
  // 800 W/m², 20 °C air, 1 m/s wind at module height; integrate until steady.
  const step = {
    poaGlobal: 800,
    tempAir: 20,
    windSpeed: 1,
    noctInstalled: 45,
    moduleHeight: 9.144,
  };
  let t = 20;
  for (let i = 0; i < 48; i++) {
    t = fuentes({ ...step, prevTempModule: t, prevPoaGlobal: 800, timestepSeconds: 3600 });
  }
  expect(Math.abs(t - 45)).toBeLessThan(0.05);
});

test("rejects nonsense inputs", () => {
  const base = {
    poaGlobal: 800,
    tempAir: 20,
    windSpeed: 1,
    noctInstalled: 45,
    prevTempModule: 20,
    prevPoaGlobal: 0,
    timestepSeconds: 3600,
  };
  expect(() => fuentes({ ...base, noctInstalled: 20 })).toThrow(RangeError);
  expect(() => fuentes({ ...base, timestepSeconds: 0 })).toThrow(RangeError);
  expect(() => fuentes({ ...base, timestepSeconds: Number.NaN })).toThrow(RangeError);
});

test("optional inputs default to pvlib's (series 0 is generated with pvlib defaults)", () => {
  for (const { input, expected } of fixtures.cases.filter((c) => c.series === 0)) {
    const { poaGlobal, tempAir, windSpeed, noctInstalled } = input;
    const { prevTempModule, prevPoaGlobal, timestepSeconds } = input;
    const got = fuentes({
      poaGlobal,
      tempAir,
      windSpeed,
      noctInstalled,
      prevTempModule,
      prevPoaGlobal,
      timestepSeconds,
    });
    expect(Math.abs(got - expected.moduleTemperature)).toBeLessThan(TOLERANCE);
  }
});
