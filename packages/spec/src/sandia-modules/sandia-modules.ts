import { decodeTable } from "../table.ts";
import data from "./sandia-modules-data.json" with { type: "json" };

/**
 * One module of the Sandia module database: Sandia Array Performance Model (SAPM)
 * coefficients. Names follow King et al. 2004; `c4`–`c7`, `ixo`, `ixxo` are absent for 10
 * entries.
 */
export interface SandiaModule {
  /** Manufacturer + model [vintage], as listed. */
  name: string;
  /** Year measured; "(E)" marks an estimated entry. */
  vintage: string;
  /** Cell material as listed, e.g. "mc-Si", "c-Si", "CdTe". */
  material: string;
  /** Module area, m². */
  area: number;
  cellsInSeries: number;
  parallelStrings: number;
  /** Short-circuit current at reference conditions, A. */
  isco: number;
  /** Open-circuit voltage at reference conditions, V. */
  voco: number;
  /** Max-power current at reference conditions, A. */
  impo: number;
  /** Max-power voltage at reference conditions, V. */
  vmpo: number;
  /** Normalized temperature coefficient of `isco`, 1/°C. */
  aisc: number;
  /** Normalized temperature coefficient of `impo`, 1/°C. */
  aimp: number;
  /** Temperature coefficient of `voco`, V/°C. */
  bvoco: number;
  /** Irradiance dependence of `bvoco`, V/°C. */
  mbvoc: number;
  /** Temperature coefficient of `vmpo`, V/°C. */
  bvmpo: number;
  /** Irradiance dependence of `bvmpo`, V/°C. */
  mbvmp: number;
  /** Diode factor. */
  n: number;
  c0: number;
  c1: number;
  c2: number;
  c3: number;
  c4?: number;
  c5?: number;
  c6?: number;
  c7?: number;
  /** Current at V = Voc/2, A. */
  ixo?: number;
  /** Current at V = (Voc + Vmp)/2, A. */
  ixxo?: number;
  /** Air-mass modifier polynomial coefficients. */
  a0: number;
  a1: number;
  a2: number;
  a3: number;
  a4: number;
  /** Incidence-angle modifier polynomial coefficients (core `iam/sapm`). */
  b0: number;
  b1: number;
  b2: number;
  b3: number;
  b4: number;
  b5: number;
  /** Fraction of diffuse irradiance used by the module. */
  fd: number;
  /** SAPM module-temperature coefficient a (core `temperature/sapm`). */
  a: number;
  /** SAPM module-temperature coefficient b, s/m. */
  b: number;
  /** Cell minus module back-surface temperature at 1000 W/m², °C. */
  tempDelta: number;
}

/** Every module of the NREL SAM "Sandia Modules" library, in library order. */
export const SANDIA_MODULES: readonly SandiaModule[] = decodeTable<SandiaModule>(data);
