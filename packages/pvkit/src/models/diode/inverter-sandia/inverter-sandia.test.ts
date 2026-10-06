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

test("pnt omitted defaults to 0 below pso (pvlib would return NaN)", () => {
  const inv = { paco: 3000, pdco: 3100, vdco: 400, pso: 20, c0: -1e-6, c1: 0, c2: 0, c3: 0 };
  expect(inverterSandia({ ...inv, vdc: 400, pdc: 10 })).toBe(-0);
});
