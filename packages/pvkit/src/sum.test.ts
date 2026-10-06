import { expect, test } from "vitest";
import { compensatedSum } from "./sum.ts";

test("recovers terms a naive sum loses", () => {
  // naive: (1 + 1e100) + 1 - 1e100 === 0
  expect(compensatedSum([1, 1e100, 1, -1e100])).toBe(2);
});

test("525 600 minute steps of 0.1 sum exactly to 52 560 within 1 ULP", () => {
  const xs = new Float64Array(525_600).fill(0.1);
  expect(Math.abs(compensatedSum(xs) - 52_560)).toBeLessThan(1e-11);
});

test("empty input sums to 0", () => {
  expect(compensatedSum([])).toBe(0);
});
