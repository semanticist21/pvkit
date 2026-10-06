import { expect, test } from "vitest";
import { skyDiffusePassias } from "./sky-diffuse-passias.ts";
import fixtures from "./sky-diffuse-passias-fixtures.json" with { type: "json" };

/** Degrees or fraction. Justification in sky-diffuse-passias.md → Reference. */
const TOLERANCE = 1e-14;

test.each(fixtures.map((c, i) => [i, c] as const))(
  "matches pvlib, case %i",
  (_, { expected, ...input }) => {
    const got = skyDiffusePassias(input as Parameters<typeof skyDiffusePassias>[0]);
    if (expected === null) expect(got).toBeNaN();
    else
      expect(Math.abs(got - expected)).toBeLessThanOrEqual(
        TOLERANCE * Math.max(1, Math.abs(expected)),
      );
  },
);
