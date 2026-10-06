import { expect, test } from "vitest";
import { groundAngle } from "./ground-angle.ts";
import fixtures from "./ground-angle-fixtures.json" with { type: "json" };

/** Degrees or fraction. Justification in ground-angle.md → Reference. */
const TOLERANCE = 1e-12;

test.each(fixtures.map((c, i) => [i, c] as const))(
  "matches pvlib, case %i",
  (_, { expected, ...input }) => {
    const got = groundAngle(input as Parameters<typeof groundAngle>[0]);
    if (expected === null) expect(got).toBeNaN();
    else
      expect(Math.abs(got - expected)).toBeLessThanOrEqual(
        TOLERANCE * Math.max(1, Math.abs(expected)),
      );
  },
);
