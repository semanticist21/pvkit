import { describe, expect, test } from "vitest";
import { close, rows } from "../testing.ts";
import { iFromV } from "./i-from-v.ts";
import fixtures from "./i-from-v-fixtures.json" with { type: "json" };

/** Relative + absolute (A). Justification in i-from-v.md → Reference. */
const RTOL = 1e-12;
const ATOL = 1e-11;

describe("iFromV vs pvlib", () => {
  test.each(rows(fixtures))("case %i", (_, { input, expected }) => {
    const got = iFromV(input);
    for (const [k, want] of Object.entries(expected)) {
      const g = typeof got === "number" ? got : got[k as keyof typeof got];
      expect(close(g as number, want as number, RTOL, ATOL), `${k}: ${g} vs ${want}`).toBe(true);
    }
  });
});

test("stays finite far beyond Voc (pvlib overflows to NaN there)", () => {
  const p = {
    photocurrent: 6,
    saturationCurrent: 1e-9,
    resistanceSeries: 0.3,
    resistanceShunt: 400,
    nNsVth: 1.6,
  };
  const i = iFromV({ ...p, voltage: 2000 });
  expect(Number.isFinite(i)).toBe(true);
  expect(i).toBeLessThan(-1000); // diode conducts hard: large negative terminal current
});
