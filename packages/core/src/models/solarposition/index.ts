/**
 * Solar position: NREL SPA, sunrise/sunset/transit (SPA and geometric), Earth–Sun
 * distance, and the simple day-of-year declination / equation-of-time / hour-angle forms.
 * Conventions (time, angles, azimuth origin): `doc/conventions.md`.
 */

export * from "./declination/index.ts";
export * from "./earth-sun-distance/index.ts";
export * from "./equation-of-time/index.ts";
export * from "./hour-angle/index.ts";
export * from "./spa/index.ts";
export * from "./sunrise-geometric/index.ts";
export * from "./sunrise-spa/index.ts";
