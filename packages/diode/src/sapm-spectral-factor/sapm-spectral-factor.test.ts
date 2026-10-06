import { describe, expect, test } from "vitest";
import { close, rows } from "../testing.ts";
import { sapmSpectralFactor } from "./sapm-spectral-factor.ts";
import fixtures from "./sapm-spectral-factor-fixtures.json" with { type: "json" };

/** Relative. Justification in sapm-spectral-factor.md → Reference. */
const RTOL = 1e-14;
const ATOL = 0;

describe("sapmSpectralFactor vs pvlib", () => {
  test.each(rows(fixtures))("case %i", (_, { input, expected }) => {
    const got = sapmSpectralFactor(input);
    for (const [k, want] of Object.entries(expected)) {
      const g = typeof got === "number" ? got : got[k as keyof typeof got];
      expect(close(g as number, want as number, RTOL, ATOL), `${k}: ${g} vs ${want}`).toBe(true);
    }
  });
});
