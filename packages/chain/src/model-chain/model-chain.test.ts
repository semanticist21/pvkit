import { describe, expect, test } from "vitest";
import { type ModelChainInput, modelChain } from "./model-chain.ts";
import fixture from "./model-chain-fixtures.json" with { type: "json" };

describe.each(fixture.cases)("$name", ({ params, steps }) => {
  const run = (s: (typeof steps)[number]) =>
    modelChain({ ...params, ...s, timeMs: s.timeMs } as ModelChainInput);

  test("every output matches pvlib ModelChain at every step", () => {
    let worst = 0;
    for (const s of steps) {
      const got = run(s);
      for (const [k, want] of Object.entries(s.expected)) {
        const v = got[k as keyof typeof got];
        worst = Math.max(worst, Math.abs(v - want) / Math.max(1, Math.abs(want)));
      }
    }
    // Chain of 1e-9…1e-12 per-method tolerances, as in core's pipeline test.
    expect(worst).toBeLessThan(1e-9);
  });
});

test("weather input overrides the clear-sky model", () => {
  const base = {
    timeMs: Date.UTC(2025, 5, 21, 3),
    latitude: 37.57,
    longitude: 126.98,
    surfaceTilt: 30,
    surfaceAzimuth: 180,
    pdc0: 5000,
    gammaPdc: -0.004,
  };
  const cs = modelChain({ ...base, linkeTurbidity: 3 });
  const measured = modelChain({ ...base, weather: { ghi: cs.ghi, dni: cs.dni, dhi: cs.dhi } });
  expect(Math.abs(measured.pac - cs.pac)).toBeLessThan(1e-12);
  expect(modelChain({ ...base, weather: { ghi: 0, dni: 0, dhi: 0 } }).pac).toBe(0);
  expect(() => modelChain(base as ModelChainInput)).toThrow(RangeError);
});
