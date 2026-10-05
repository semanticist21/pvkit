import { describe, expect, test } from "vitest";
import { singleaxis } from "./singleaxis.ts";
import fixtures from "./singleaxis-fixtures.json" with { type: "json" };

type Field = keyof ReturnType<typeof singleaxis>;
const FIELDS: readonly Field[] = ["trackerTheta", "aoi", "surfaceTilt", "surfaceAzimuth"];

/** Degrees. Justification in singleaxis.md → Reference. */
const TOLERANCE = 1e-9;

describe("singleaxis vs pvlib tracking.singleaxis", () => {
  test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
    const got = singleaxis(input);
    for (const f of FIELDS) {
      const want = expected[f];
      if (want === null) {
        expect(got[f], f).toBeNaN();
        continue;
      }
      const err = Math.abs(got[f] - want);
      // surfaceAzimuth wraps at 0/360
      const wrapped = f === "surfaceAzimuth" ? Math.min(err, 360 - err) : err;
      expect(wrapped, f).toBeLessThan(TOLERANCE);
    }
  });
});

test("horizontal N-S axis tracks an eastern sun to the sun's elevation (geometry)", () => {
  // Sun due east at elevation 30°: true tracking tilts the surface 60° toward east.
  const got = singleaxis({
    apparentZenith: 60,
    solarAzimuth: 90,
    axisAzimuth: 180,
    backtrack: false,
  });
  expect(got.trackerTheta).toBeCloseTo(-60, 12);
  expect(got.surfaceTilt).toBeCloseTo(60, 12);
  expect(got.surfaceAzimuth).toBeCloseTo(90, 12);
  expect(got.aoi).toBeCloseTo(0, 6);
  // Backtracking (Lorenzo 2011, flat ground): θ = ωideal + acos(cos(ωideal)/gcr).
  const bt = singleaxis({ apparentZenith: 60, solarAzimuth: 90, axisAzimuth: 180, gcr: 0.6 });
  expect(bt.trackerTheta).toBeCloseTo(-60 + (Math.acos(0.5 / 0.6) * 180) / Math.PI, 12);
});

test("rejects out-of-range inputs", () => {
  const sun = { apparentZenith: 30, solarAzimuth: 120 };
  expect(() => singleaxis({ ...sun, gcr: 0 })).toThrow(RangeError);
  expect(() => singleaxis({ ...sun, gcr: 1.5 })).toThrow(RangeError);
  expect(() => singleaxis({ ...sun, gcr: Number.NaN })).toThrow(RangeError);
  expect(() => singleaxis({ ...sun, maxAngle: -10 })).toThrow(RangeError);
  expect(() => singleaxis({ ...sun, minAngle: 50, maxAngle: 40 })).toThrow(RangeError);
  // gcr is irrelevant without backtracking.
  expect(() => singleaxis({ ...sun, gcr: 0, backtrack: false })).not.toThrow();
});
