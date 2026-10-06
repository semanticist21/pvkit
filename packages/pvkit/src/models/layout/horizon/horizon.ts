import type { Degrees } from "../../../units.ts";

export interface HorizonPoint {
  /** Degrees from north, clockwise. */
  azimuth: number;
  /** Horizon elevation, degrees. */
  elevation: number;
}

/**
 * Horizon elevation at `azimuth`, degrees, linearly interpolated around the full circle
 * (wraps 360°; as `numpy.interp(..., period=360)`). The sun is blocked when its apparent
 * elevation is below this. Profile points need not be sorted; a NaN azimuth gives NaN.
 *
 * A PVGIS `printhorizon` profile measures `A` from south (0 = S, −90 = E, +90 = W): map
 * each row to `{ azimuth: A + 180, elevation: H_hor }` first, or the horizon comes out
 * rotated 180°.
 *
 * @example horizonElevation({ profile: [{ azimuth: 90, elevation: 10 }, { azimuth: 270, elevation: 0 }], azimuth: 180 }); // 5
 */
export const horizonElevation = ({
  profile,
  azimuth,
}: {
  profile: readonly HorizonPoint[];
  azimuth: number;
}): Degrees => {
  if (profile.length === 0) return 0 as Degrees;
  const pts = profile
    .map((p) => ({ a: ((p.azimuth % 360) + 360) % 360, e: p.elevation }))
    .sort((x, y) => x.a - y.a);
  const az = ((azimuth % 360) + 360) % 360;
  const first = pts[0] as { a: number; e: number };
  const last = pts[pts.length - 1] as { a: number; e: number };
  // Wrap: append the first point at +360 and prepend the last at −360.
  const ring = [{ a: last.a - 360, e: last.e }, ...pts, { a: first.a + 360, e: first.e }];
  for (let i = 1; i < ring.length; i++) {
    const hi = ring[i] as { a: number; e: number };
    if (az <= hi.a) {
      const lo = ring[i - 1] as { a: number; e: number };
      return (
        hi.a === lo.a ? hi.e : lo.e + ((az - lo.a) / (hi.a - lo.a)) * (hi.e - lo.e)
      ) as Degrees;
    }
  }
  return Number.NaN as Degrees; // only a NaN azimuth gets here (az < 360 ≤ ring end), as numpy.interp
};
