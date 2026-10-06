import { describe, expect, test } from "vitest";
import { close, rows } from "../testing.ts";
import { singleDiode } from "./single-diode.ts";
import fixtures from "./single-diode-fixtures.json" with { type: "json" };

/** Relative + absolute (A or V). Justification in single-diode.md → Reference. */
const RTOL = 1e-12;
const ATOL = 1e-11;

describe("singleDiode vs pvlib", () => {
  test.each(rows(fixtures))("case %i", (_, { input, expected }) => {
    const got = singleDiode(input);
    for (const [k, want] of Object.entries(expected)) {
      const g = typeof got === "number" ? got : got[k as keyof typeof got];
      expect(close(g as number, want as number, RTOL, ATOL), `${k}: ${g} vs ${want}`).toBe(true);
    }
  });
});

test("zero irradiance: Rsh = ∞, IL = 0 → all points 0", () => {
  const r = singleDiode({
    photocurrent: 0,
    saturationCurrent: 1e-10,
    resistanceSeries: 0.3,
    resistanceShunt: Number.POSITIVE_INFINITY,
    nNsVth: 1.6,
  });
  for (const v of Object.values(r)) expect(Math.abs(v)).toBeLessThan(1e-12);
});
