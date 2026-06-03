import { expect, test } from "bun:test";
import { degrees, radians, toDegrees, toRadians } from "./units.ts";

test("toDegrees converts radians to degrees", () => {
  expect(toDegrees(radians(Math.PI))).toBeCloseTo(180, 12);
});

test("toRadians converts degrees to radians", () => {
  expect(toRadians(degrees(180))).toBeCloseTo(Math.PI, 12);
});

test("round-trip preserves value", () => {
  expect(toRadians(toDegrees(radians(1.2345)))).toBeCloseTo(1.2345, 12);
});
