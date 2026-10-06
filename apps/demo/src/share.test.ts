import { expect, test } from "vitest";
import type { EstimateInput } from "./estimate.ts";
import source from "./estimate.ts?raw";
import { codeFor, readQuery } from "./share.ts";

const fields = [
  { name: "latitude", defaultValue: "37.5665", min: "-90", max: "90" },
  { name: "dcKw", defaultValue: "5", min: "0.01", max: "" },
];

test("valid params override defaults", () => {
  expect(readQuery("?latitude=-33.9&dcKw=12.5", fields)).toEqual({
    latitude: "-33.9",
    dcKw: "12.5",
  });
});

test("missing, empty, non-numeric or out-of-range params fall back to defaults", () => {
  const defaults = { latitude: "37.5665", dcKw: "5" };
  expect(readQuery("", fields)).toEqual(defaults);
  expect(readQuery("?latitude=&dcKw=abc", fields)).toEqual(defaults);
  expect(readQuery("?latitude=91&dcKw=0", fields)).toEqual(defaults);
  expect(readQuery("?latitude=Infinity&dcKw=NaN&other=1", fields)).toEqual(defaults);
});

test("unbounded max accepts large values; numbers are normalized", () => {
  expect(readQuery("?dcKw=1e3&latitude=%2010%20", fields)).toEqual({
    latitude: "10",
    dcKw: "1000",
  });
});

test("generated code is the demo's estimate source plus a call with the same inputs", () => {
  const input: EstimateInput = {
    latitude: -33.9,
    longitude: 18.4,
    altitude: 10,
    tilt: 25,
    azimuth: 0,
    dcKw: 3,
    losses: 14.1 / 100,
    linkeTurbidity: 3,
    tempAir: 18,
  };
  const code = codeFor(input);
  expect(code.startsWith(source.trimEnd())).toBe(true);
  const call = code.match(/const result = estimate\((\{[^}]*\})\);/)?.[1];
  expect(call).toContain("losses: 0.141,");
  const args = Function(`return ${call}`)() as EstimateInput;
  for (const [k, v] of Object.entries(input)) {
    expect(args[k as keyof EstimateInput]).toBeCloseTo(v, 12);
  }
});
