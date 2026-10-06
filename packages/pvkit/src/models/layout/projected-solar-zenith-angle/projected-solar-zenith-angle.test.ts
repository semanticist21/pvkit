import { expect, test } from "vitest";
import { projectedSolarZenithAngle } from "./projected-solar-zenith-angle.ts";
import fixtures from "./projected-solar-zenith-angle-fixtures.json" with { type: "json" };

/** Degrees or fraction. Justification in projected-solar-zenith-angle.md → Reference. */
const TOLERANCE = 1e-12;

test.each(fixtures.map((c, i) => [i, c] as const))(
  "matches pvlib, case %i",
  (_, { expected, ...input }) => {
    const got = projectedSolarZenithAngle(input as Parameters<typeof projectedSolarZenithAngle>[0]);
    if (expected === null) expect(got).toBeNaN();
    else
      expect(Math.abs(got - expected)).toBeLessThanOrEqual(
        TOLERANCE * Math.max(1, Math.abs(expected)),
      );
  },
);
