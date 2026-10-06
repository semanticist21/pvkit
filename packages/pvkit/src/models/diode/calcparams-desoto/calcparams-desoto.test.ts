import { describe, expect, test } from "vitest";
import { close, rows } from "../testing.ts";
import { calcparamsDesoto } from "./calcparams-desoto.ts";
import fixtures from "./calcparams-desoto-fixtures.json" with { type: "json" };

/** Relative. Justification in calcparams-desoto.md → Reference. */
const RTOL = 1e-13;
const ATOL = 0;

describe("calcparamsDesoto vs pvlib", () => {
  test.each(rows(fixtures))("case %i", (_, { input, expected }) => {
    const got = calcparamsDesoto(input);
    for (const [k, want] of Object.entries(expected)) {
      const g = typeof got === "number" ? got : got[k as keyof typeof got];
      expect(close(g as number, want as number, RTOL, ATOL), `${k}: ${g} vs ${want}`).toBe(true);
    }
  });
});
