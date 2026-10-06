import { expect, test } from "vitest";
import { roofFit } from "./roof-fit.ts";

const mod = { moduleLength: 1.7, moduleWidth: 1.1 };

test("hand-counted grids", () => {
  // portrait: floor((10+0.02)/1.12)=8 columns, floor((5+0.02)/1.72)=2 rows = 16
  // landscape: floor(10.02/1.72)=5 columns, floor(5.02/1.12)=4 rows = 20 → best
  const r = roofFit({ roofWidth: 10, roofHeight: 5, ...mod });
  expect([r.orientation, r.columns, r.rows, r.count]).toEqual(["landscape", 5, 4, 20]);
  expect(r.modules).toHaveLength(20);
  const p = roofFit({ roofWidth: 10, roofHeight: 5, ...mod, orientation: "portrait" });
  expect([p.columns, p.rows, p.count]).toEqual([8, 2, 16]);
  // setback 0.5 on each edge: usable 9 × 4 → landscape 5×3=15, portrait 8×2=16 → portrait
  const s = roofFit({ roofWidth: 10, roofHeight: 5, ...mod, setback: 0.5 });
  expect([s.orientation, s.count]).toEqual(["portrait", 16]);
});

test("exact fit survives float error; too small fits nothing", () => {
  expect(
    roofFit({ roofWidth: 3.3, roofHeight: 1.7, ...mod, gap: 0, orientation: "portrait" }).count,
  ).toBe(3);
  expect(roofFit({ roofWidth: 1, roofHeight: 1, ...mod }).count).toBe(0);
  expect(roofFit({ roofWidth: 2, roofHeight: 2, ...mod, setback: 1 }).modules).toEqual([]);
});

test("modules are centred, inside the setback, and do not overlap", () => {
  const setback = 0.4;
  const { modules } = roofFit({ roofWidth: 8.3, roofHeight: 6.1, ...mod, setback });
  const xs = modules.map((m) => m.x);
  const right = Math.max(...modules.map((m) => m.x + m.width));
  expect(Math.min(...xs) - setback).toBeCloseTo(8.3 - setback - right, 12);
  for (const m of modules) {
    expect(m.x).toBeGreaterThanOrEqual(setback - 1e-12);
    expect(m.y + m.height).toBeLessThanOrEqual(6.1 - setback + 1e-12);
  }
  for (const [i, a] of modules.entries()) {
    for (const b of modules.slice(i + 1)) {
      const apart =
        a.x + a.width <= b.x + 1e-12 ||
        b.x + b.width <= a.x + 1e-12 ||
        a.y + a.height <= b.y + 1e-12 ||
        b.y + b.height <= a.y + 1e-12;
      expect(apart).toBe(true);
    }
  }
});

test("rejects non-positive or non-finite sizes", () => {
  expect(() => roofFit({ roofWidth: 0, roofHeight: 5, ...mod })).toThrow(RangeError);
  expect(() => roofFit({ roofWidth: 5, roofHeight: 5, ...mod, gap: -1 })).toThrow(RangeError);
  expect(() => roofFit({ roofWidth: 5, roofHeight: 5, ...mod, gap: Infinity })).toThrow(RangeError);
  expect(() => roofFit({ roofWidth: 5, roofHeight: 5, ...mod, setback: Number.NaN })).toThrow(
    RangeError,
  );
});
