import { describe, expect, test } from "vitest";
import { ashrae } from "../ashrae/ashrae.ts";
import { martinRuiz } from "../martin-ruiz/martin-ruiz.ts";
import { physical } from "../physical/physical.ts";
import { sapm } from "../sapm/sapm.ts";
import { type MarionRegion, marionDiffuse, marionIntegrate } from "./marion.ts";
import fixtures from "./marion-fixtures.json" with { type: "json" };

/** Unitless. Justification in marion.md → Reference. */
const TOLERANCE = 1e-12;
const REGIONS: readonly MarionRegion[] = ["sky", "horizon", "ground"];

type Params = Record<string, number>;
const MODELS: Record<string, (p: Params) => (aoi: number) => number> = {
  physical: (p) => (aoi) => physical({ aoi, ...p }),
  ashrae: (p) => (aoi) => ashrae({ aoi, ...p }),
  martinRuiz: (p) => (aoi) => martinRuiz({ aoi, ...p }),
  sapm: (p) => (aoi) =>
    sapm({ aoi, b0: 0, b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, ...(p as Partial<Params>) }),
};

describe("marion vs pvlib", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    const model = MODELS[input.model];
    if (!model) throw new Error(`unknown model ${input.model}`);
    const iam = model(input.params as Params);
    const num = "num" in input ? (input.num as number) : undefined;
    for (const region of REGIONS) {
      const got = marionIntegrate({
        iam,
        surfaceTilt: input.surfaceTilt,
        region,
        ...(num === undefined ? {} : { num }),
      });
      expect(Math.abs(got - expected[region]), region).toBeLessThan(TOLERANCE);
    }
    if (num === undefined) {
      const got = marionDiffuse({ iam, surfaceTilt: input.surfaceTilt });
      for (const region of REGIONS) {
        expect(Math.abs(got[region] - expected[region]), region).toBeLessThan(TOLERANCE);
      }
    }
  });
});

test("pvlib docstring example: physical, tilt 20", () => {
  const got = marionDiffuse({ iam: (aoi) => physical({ aoi }), surfaceTilt: 20 });
  expect(got.sky).toBeCloseTo(0.9539178294437575, 12);
  expect(got.horizon).toBeCloseTo(0.7652650139134007, 12);
  expect(got.ground).toBeCloseTo(0.6387140117795903, 12);
});

test("constant IAM integrates to itself; empty region → 0; NaN tilt → NaN", () => {
  const one = () => 1;
  expect(marionIntegrate({ iam: one, surfaceTilt: 30, region: "sky" })).toBeCloseTo(1, 14);
  expect(marionIntegrate({ iam: one, surfaceTilt: 0, region: "ground" })).toBe(0);
  expect(marionIntegrate({ iam: one, surfaceTilt: Number.NaN, region: "sky" })).toBeNaN();
});

test("rejects bad num / region", () => {
  const iam = () => 1;
  expect(() => marionIntegrate({ iam, surfaceTilt: 0, region: "sky", num: 0 })).toThrow(RangeError);
  expect(() => marionIntegrate({ iam, surfaceTilt: 0, region: "sky", num: 1.5 })).toThrow(
    RangeError,
  );
  expect(() => marionIntegrate({ iam, surfaceTilt: 0, region: "up" as MarionRegion })).toThrow(
    RangeError,
  );
});
