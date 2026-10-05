import { expect, test } from "vitest";
import { poaComponents } from "./poa-components.ts";
import fixtures from "./poa-components-fixtures.json" with { type: "json" };

/** Relative to max(1, |expected|) W/m². Justification in poa-components.md. */
const TOLERANCE = 1e-12;

test.each(fixtures.cases.map((c, i) => [i, c] as const))("case %i", (_, { input, expected }) => {
  const got = poaComponents(input);
  for (const [k, want] of Object.entries(expected)) {
    const err = Math.abs(got[k as keyof typeof got] - want) / Math.max(1, Math.abs(want));
    expect(err, k).toBeLessThan(TOLERANCE);
  }
});

test("sun behind the panel contributes no beam", () => {
  const got = poaComponents({ aoi: 120, dni: 800, poaSkyDiffuse: 100, poaGroundDiffuse: 20 });
  expect(got.poaDirect).toBe(0);
  expect(got.poaGlobal).toBe(120);
});
