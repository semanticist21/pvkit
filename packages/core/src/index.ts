/**
 * @pvkit/core — PV performance modeling core.
 *
 * The root entry exports only the unit types and helpers. Models are imported
 * from their subpaths, which keeps bundles to exactly what you use:
 *
 *   import { spa } from "@pvkit/core/solarposition/spa";
 *   import { perez } from "@pvkit/core/irradiance";
 *
 * Do not add `export * as <module>` here — see doc/playbook.md (2026-10-05, root namespaces).
 */

export * from "./units.ts";
