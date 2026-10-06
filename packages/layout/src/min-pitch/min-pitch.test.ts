import { expect, test } from "vitest";
import { shadedFraction1d } from "../shaded-fraction1d/index.ts";
import { minPitch } from "./min-pitch.ts";

const suns = [
  [60, 180],
  [70, 150],
  [75, 220],
  [50, 120],
] as const;

test.each(suns)(
  "is the shade/no-shade boundary of shadedFraction1d (zenith %d, azimuth %d)",
  (z, a) => {
    for (const [tilt, azimuth] of [
      [30, 180],
      [15, 160],
      [45, 200],
    ] as const) {
      const pitch = minPitch({
        collectorWidth: 2,
        surfaceTilt: tilt,
        surfaceAzimuth: azimuth,
        solarZenith: z,
        solarAzimuth: a,
      });
      const sf = (p: number) =>
        shadedFraction1d({
          solarZenith: z,
          solarAzimuth: a,
          axisAzimuth: azimuth - 90,
          shadedRowRotation: tilt,
          collectorWidth: 2,
          pitch: p,
        });
      expect(sf(pitch)).toBeLessThan(1e-12);
      expect(sf(pitch * 0.99)).toBeGreaterThan(0);
    }
  },
);

test("textbook case: south rows, noon sun in the row cross-section", () => {
  // W·(cos β + sin β / tan α), α = 30° elevation, β = 30°
  const want = 2 * (Math.cos(Math.PI / 6) + Math.sin(Math.PI / 6) / Math.tan(Math.PI / 6));
  expect(
    minPitch({
      collectorWidth: 2,
      surfaceTilt: 30,
      surfaceAzimuth: 180,
      solarZenith: 60,
      solarAzimuth: 180,
    }),
  ).toBeCloseTo(want, 12);
  expect(
    minPitch({
      collectorWidth: 2,
      surfaceTilt: 30,
      surfaceAzimuth: 180,
      solarZenith: 90,
      solarAzimuth: 180,
    }),
  ).toBe(Number.POSITIVE_INFINITY);
});

test("sun behind the rows: no front-face shade, pitch is the footprint W·cos β", () => {
  const footprint = 2 * Math.cos(Math.PI / 6);
  for (const [solarZenith, solarAzimuth] of [
    [80, 0],
    [70, 0],
    [60, 0],
    [70, 300],
  ] as const) {
    expect(
      minPitch({
        collectorWidth: 2,
        surfaceTilt: 30,
        surfaceAzimuth: 180,
        solarZenith,
        solarAzimuth,
      }),
    ).toBeCloseTo(footprint, 12);
  }
});
