import { expect, test } from "vitest";
import * as root from "./index.ts";

test("root entry exports exactly the unit helpers (models come from subpaths)", () => {
  expect(Object.keys(root).sort()).toEqual(
    ["degrees", "limitDegrees", "limitRadians", "radians", "toDegrees", "toRadians"].sort(),
  );
});
