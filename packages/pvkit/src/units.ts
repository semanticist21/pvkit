/**
 * Branded unit types.
 *
 * A core differentiator of pvkit: rad/deg mix-ups are caught at compile time.
 * Zero runtime cost — the brand is erased at build, leaving only `number`.
 *
 * @example
 * declare function solarZenith(): Radians;
 * const z = solarZenith();
 * Math.cos(z);        // OK — Radians is a number
 * toDegrees(z);       // OK
 * solarAzimuth(z);    // type error: Radians where Degrees is expected
 */

declare const brand: unique symbol;

/** Nominal brand helper. */
type Brand<T, B> = T & { readonly [brand]: B };

/** Angle in radians. */
export type Radians = Brand<number, "Radians">;

/** Angle in degrees. */
export type Degrees = Brand<number, "Degrees">;

const DEG_PER_RAD = 180 / Math.PI;
const RAD_PER_DEG = Math.PI / 180;

/** Tag a raw number as Radians (no validation). */
export const radians = (value: number): Radians => value as Radians;

/** Tag a raw number as Degrees (no validation). */
export const degrees = (value: number): Degrees => value as Degrees;

/** Radians → degrees. */
export const toDegrees = (value: Radians): Degrees => (value * DEG_PER_RAD) as Degrees;

/** Degrees → radians. */
export const toRadians = (value: Degrees): Radians => (value * RAD_PER_DEG) as Radians;

const TWO_PI = 2 * Math.PI;

/**
 * Wrap an angle into `[0, 360)`.
 *
 * Models that accumulate angles (e.g. SPA: heliocentric longitude can reach
 * thousands of degrees) MUST reduce before any `Math.sin`/`Math.cos` — large
 * arguments lose precision in the engine's range reduction. This is the SPA
 * spec's `limit_degrees`. The second mod renormalizes the sub-ULP case where
 * `tinyNegative + 360` rounds to exactly `360`, so the result is never `360`.
 *
 * @see doc/architecture.md — "Numerical strategy — float64, zero deps"
 */
export const limitDegrees = (value: number): Degrees => {
  const wrapped = value % 360;
  return ((wrapped < 0 ? wrapped + 360 : wrapped) % 360) as Degrees;
};

/** Wrap an angle into `[0, 2π)`. Radian counterpart of {@link limitDegrees}. */
export const limitRadians = (value: number): Radians => {
  const wrapped = value % TWO_PI;
  return ((wrapped < 0 ? wrapped + TWO_PI : wrapped) % TWO_PI) as Radians;
};
