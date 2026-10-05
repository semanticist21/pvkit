/**
 * Single-axis tracker geometry: rotation with slope-aware backtracking, plus the
 * sloped-terrain axis-tilt helpers. Pure geometry — sun position and slope are caller
 * inputs. Conventions (angles, azimuth origin): `doc/conventions.md`.
 */

export * from "./calc-axis-tilt/index.ts";
export * from "./calc-cross-axis-tilt/index.ts";
export * from "./singleaxis/index.ts";
