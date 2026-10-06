import { describe, expect, test } from "vitest";
import { close, rows } from "../testing.ts";
import { sapm } from "./sapm.ts";
import fixtures from "./sapm-fixtures.json" with { type: "json" };

/** Relative. Justification in sapm.md → Reference. */
const RTOL = 1e-14;
const ATOL = 0;

describe("sapm vs pvlib", () => {
  test.each(rows(fixtures))("case %i", (_, { input, expected }) => {
    const got = sapm(input);
    for (const [k, want] of Object.entries(expected)) {
      const g = typeof got === "number" ? got : got[k as keyof typeof got];
      expect(close(g as number, want as number, RTOL, ATOL), `${k}: ${g} vs ${want}`).toBe(true);
    }
  });
});
