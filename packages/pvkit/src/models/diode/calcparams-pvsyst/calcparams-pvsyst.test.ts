import { describe, expect, test } from "vitest";
import { close, rows } from "../testing.ts";
import { calcparamsPvsyst } from "./calcparams-pvsyst.ts";
import fixtures from "./calcparams-pvsyst-fixtures.json" with { type: "json" };

/** Relative. Justification in calcparams-pvsyst.md → Reference. */
const RTOL = 1e-13;
const ATOL = 0;

describe("calcparamsPvsyst vs pvlib", () => {
  test.each(rows(fixtures))("case %i", (_, { input, expected }) => {
    const got = calcparamsPvsyst(input);
    for (const [k, want] of Object.entries(expected)) {
      const g = typeof got === "number" ? got : got[k as keyof typeof got];
      expect(close(g as number, want as number, RTOL, ATOL), `${k}: ${g} vs ${want}`).toBe(true);
    }
  });
});
