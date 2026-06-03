import { expect, test } from "bun:test";
import { degrees, limitDegrees, limitRadians, radians, toDegrees, toRadians } from "./units.ts";

test("toDegrees converts radians to degrees", () => {
  expect(toDegrees(radians(Math.PI))).toBeCloseTo(180, 12);
});

test("toRadians converts degrees to radians", () => {
  expect(toRadians(degrees(180))).toBeCloseTo(Math.PI, 12);
});

test("round-trip preserves value", () => {
  expect(toRadians(toDegrees(radians(1.2345)))).toBeCloseTo(1.2345, 12);
});

test("limitDegrees wraps into [0, 360)", () => {
  expect(limitDegrees(45)).toBeCloseTo(45, 12);
  expect(limitDegrees(360)).toBeCloseTo(0, 12);
  expect(limitDegrees(370)).toBeCloseTo(10, 12);
  expect(limitDegrees(3601)).toBeCloseTo(1, 12); // SPA-scale accumulated angle
  expect(limitDegrees(-10)).toBeCloseTo(350, 12);
});

test("limitDegrees stays in [0, 360) — sub-ULP negative renormalizes to 0", () => {
  // -1e-15 + 360 rounds to exactly 360 (below float resolution near 360);
  // the second mod folds that back to 0 so the result is never 360.
  expect(limitDegrees(-1e-15) as number).toBe(0);
  // a representable tiny negative wraps to just under 360, still in range.
  expect((limitDegrees(-1e-13) as number) < 360).toBe(true);
});

test("limitRadians wraps into [0, 2π)", () => {
  const twoPi = 2 * Math.PI;
  expect(limitRadians(Math.PI)).toBeCloseTo(Math.PI, 12);
  expect(limitRadians(twoPi)).toBeCloseTo(0, 12);
  expect(limitRadians(twoPi + 1)).toBeCloseTo(1, 12);
  expect(limitRadians(-1)).toBeCloseTo(twoPi - 1, 12);
});

test("limitRadians stays in [0, 2π) — sub-ULP negative renormalizes to 0", () => {
  // -1e-16 + 2π rounds to exactly 2π; the second mod folds it back to 0.
  expect(limitRadians(-1e-16) as number).toBe(0);
  expect((limitRadians(-1e-13) as number) < 2 * Math.PI).toBe(true);
});
