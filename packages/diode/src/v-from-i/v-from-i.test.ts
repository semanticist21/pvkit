import { describe, expect, test } from "vitest";
import { close, rows } from "../testing.ts";
import { vFromI } from "./v-from-i.ts";
import fixtures from "./v-from-i-fixtures.json" with { type: "json" };

/** Relative + absolute (V). Justification in v-from-i.md → Reference. */
const RTOL = 1e-12;
const ATOL = 1e-11;

describe("vFromI vs pvlib", () => {
  test.each(rows(fixtures))("case %i", (_, { input, expected }) => {
    const got = vFromI(input);
    for (const [k, want] of Object.entries(expected)) {
      const g = typeof got === "number" ? got : got[k as keyof typeof got];
      expect(close(g as number, want as number, RTOL, ATOL), `${k}: ${g} vs ${want}`).toBe(true);
    }
  });
});
