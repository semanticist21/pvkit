import { expect, test } from "vitest";
import { maskingAngle } from "./masking-angle.ts";
import fixtures from "./masking-angle-fixtures.json" with { type: "json" };

/** Degrees or fraction. Justification in masking-angle.md → Reference. */
const TOLERANCE = 1e-12;

test.each(fixtures.map((c, i) => [i, c] as const))(
  "matches pvlib, case %i",
  (_, { expected, ...input }) => {
    const got = maskingAngle(input as Parameters<typeof maskingAngle>[0]);
    if (expected === null) expect(got).toBeNaN();
    else
      expect(Math.abs(got - expected)).toBeLessThanOrEqual(
        TOLERANCE * Math.max(1, Math.abs(expected)),
      );
  },
);
