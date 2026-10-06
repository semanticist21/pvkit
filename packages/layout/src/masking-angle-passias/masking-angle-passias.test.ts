import { expect, test } from "vitest";
import { maskingAnglePassias } from "./masking-angle-passias.ts";
import fixtures from "./masking-angle-passias-fixtures.json" with { type: "json" };

/** Degrees or fraction. Justification in masking-angle-passias.md → Reference. */
const TOLERANCE = 1e-10;

test.each(fixtures.map((c, i) => [i, c] as const))(
  "matches pvlib, case %i",
  (_, { expected, ...input }) => {
    const got = maskingAnglePassias(input as Parameters<typeof maskingAnglePassias>[0]);
    if (expected === null) expect(got).toBeNaN();
    else
      expect(Math.abs(got - expected)).toBeLessThanOrEqual(
        TOLERANCE * Math.max(1, Math.abs(expected)),
      );
  },
);
