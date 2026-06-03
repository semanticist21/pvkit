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
