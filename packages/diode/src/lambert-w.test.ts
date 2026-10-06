import { expect, test } from "vitest";
import { lambertWExp } from "./lambert-w.ts";

test("known values: W(e) = 1, W(1) = Ω, W(x) ≈ x for tiny x", () => {
  expect(lambertWExp(1)).toBeCloseTo(1, 15);
  expect(lambertWExp(0)).toBeCloseTo(0.5671432904097838, 15); // omega constant
  expect(lambertWExp(-50) / Math.exp(-50)).toBeCloseTo(1, 12);
});

test("satisfies w + ln w = logX far past float64 overflow of e^logX", () => {
  for (const logX of [-700, -3, 0.5, 2, 30, 709, 5000, 1e6]) {
    const w = lambertWExp(logX);
    expect(Math.abs(w + Math.log(w) - logX)).toBeLessThan(
      4 * Number.EPSILON * Math.max(1, Math.abs(logX)),
    );
  }
});

test("limits", () => {
  expect(lambertWExp(Number.NEGATIVE_INFINITY)).toBe(0);
  expect(lambertWExp(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY);
  expect(lambertWExp(Number.NaN)).toBeNaN();
});
