/**
 * @pvkit/spec — module and inverter parameter libraries.
 *
 * The root entry exports only the record types (zero bytes at runtime). Each library is its
 * own subpath, so a bundle carries only the data it imports:
 *
 *   import { CEC_MODULES } from "@pvkit/spec/cec-modules";
 */

export type { CecInverter } from "./cec-inverters/cec-inverters.ts";
export type { CecModule } from "./cec-modules/cec-modules.ts";
export type { SandiaModule } from "./sandia-modules/sandia-modules.ts";
