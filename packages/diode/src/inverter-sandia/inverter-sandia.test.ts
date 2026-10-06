import { describe, expect, test } from "vitest";
import { close, rows } from "../testing.ts";
import { inverterSandia } from "./inverter-sandia.ts";
import fixtures from "./inverter-sandia-fixtures.json" with { type: "json" };

/** Relative. Justification in inverter-sandia.md → Reference. */
const RTOL = 1e-14;
const ATOL = 0;

describe("inverterSandia vs pvlib", () => {
  test.each(rows(fixtures))("case %i", (_, { input, expected }) => {
    const got = inverterSandia(input);
    for (const [k, want] of Object.entries(expected)) {
      const g = typeof got === "number" ? got : got[k as keyof typeof got];
      expect(close(g as number, want as number, RTOL, ATOL), `${k}: ${g} vs ${want}`).toBe(true);
    }
  });
});
