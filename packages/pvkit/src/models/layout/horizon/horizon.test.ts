import { expect, test } from "vitest";
import { horizonElevation } from "./horizon.ts";
import fixture from "./horizon-fixtures.json" with { type: "json" };

test.each(fixture.cases)(
  "matches numpy.interp(period=360) at azimuth $azimuth",
  ({ azimuth, expected }) => {
    expect(horizonElevation({ profile: fixture.profile, azimuth })).toBeCloseTo(
      expected ?? Number.NaN,
      12,
    );
  },
);

test("unsorted and out-of-range profile azimuths; single point; empty profile", () => {
  const profile = [...fixture.profile]
    .reverse()
    .map((p, i) => (i === 0 ? { ...p, azimuth: p.azimuth - 360 } : p));
  for (const { azimuth, expected } of fixture.cases) {
    expect(horizonElevation({ profile, azimuth })).toBeCloseTo(expected ?? Number.NaN, 12);
  }
  expect(horizonElevation({ profile: [{ azimuth: 10, elevation: 4 }], azimuth: 200 })).toBe(4);
  expect(horizonElevation({ profile: [], azimuth: 200 })).toBe(0);
  expect(horizonElevation({ profile, azimuth: Number.NaN })).toBeNaN();
});
