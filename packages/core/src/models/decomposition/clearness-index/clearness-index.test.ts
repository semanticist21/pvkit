import { expect, test } from "vitest";
import { clearnessIndex } from "./clearness-index.ts";
import fixtures from "./clearness-index-fixtures.json" with { type: "json" };

/** Dimensionless. Justification in clearness-index.md → Reference. */
const TOLERANCE = 1e-12;

test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
  expect(Math.abs(clearnessIndex(input) - expected.kt)).toBeLessThan(TOLERANCE);
});
