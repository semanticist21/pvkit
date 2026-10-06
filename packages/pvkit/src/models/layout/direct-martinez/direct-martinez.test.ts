import { expect, test } from "vitest";
import { directMartinez } from "./direct-martinez.ts";
import fixtures from "./direct-martinez-fixtures.json" with { type: "json" };

/** Degrees or fraction. Justification in direct-martinez.md → Reference. */
const TOLERANCE = 1e-14;

test.each(fixtures.map((c, i) => [i, c] as const))(
  "matches pvlib, case %i",
  (_, { expected, ...input }) => {
    const got = directMartinez(input as Parameters<typeof directMartinez>[0]);
    if (expected === null) expect(got).toBeNaN();
    else
      expect(Math.abs(got - expected)).toBeLessThanOrEqual(
        TOLERANCE * Math.max(1, Math.abs(expected)),
      );
  },
);
