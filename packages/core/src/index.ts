/**
 * @pvkit/core — PV performance modeling core.
 *
 * The root barrel only re-exports the unit types and submodules. For best
 * tree-shaking, prefer subpath imports in real usage:
 *
 *   import { spa } from "@pvkit/core/solarposition";
 *
 * which pulls in less than a root-barrel import.
 */

export * as irradiance from "./irradiance/index.ts";
export * as pvsystem from "./pvsystem/index.ts";
export * as solarposition from "./solarposition/index.ts";
export * as temperature from "./temperature/index.ts";
export * from "./units.ts";
