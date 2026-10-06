import { test } from "vitest";
import { spa } from "./spa.ts";

const start = Date.UTC(2025, 0, 1);
let i = 0;

test("spa", async ({ bench }) => {
  await bench("one call (minute steps)", () => {
    spa({ timeMs: start + (i++ % 525_600) * 60_000, latitude: 37.5665, longitude: 126.978 });
  }).run();
});
