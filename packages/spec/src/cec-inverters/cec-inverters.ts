import { decodeTable } from "../table.ts";
import data from "./cec-inverters-data.json" with { type: "json" };

/** One inverter of the CEC inverter list with its Sandia inverter-model parameters. */
export interface CecInverter {
  /** Manufacturer: model {AC voltage}, as listed. */
  name: string;
  /** Nominal AC voltage, V. */
  vac: number;
  /** Maximum AC output power, W. */
  paco: number;
  /** DC power at which `paco` is reached, W. */
  pdco: number;
  /** DC voltage at which the other parameters were fit, V. */
  vdco: number;
  /** DC power to start inversion (self-consumption), W. */
  pso: number;
  /** Curvature of AC vs DC power at `vdco`, 1/W. */
  c0: number;
  /** Variation of `pdco` with DC voltage, 1/V. */
  c1: number;
  /** Variation of `pso` with DC voltage, 1/V. */
  c2: number;
  /** Variation of `c0` with DC voltage, 1/V. */
  c3: number;
  /** AC power drawn at night, W (absent for 8 entries). */
  pnt?: number;
  /** Maximum DC input voltage, V. */
  vdcMax: number;
  /** Maximum DC input current, A. */
  idcMax: number;
  /** Lower bound of the MPPT voltage window, V. */
  mpptLow: number;
  /** Upper bound of the MPPT voltage window, V. */
  mpptHigh: number;
  /** Listed as a hybrid (battery-capable) inverter. */
  hybrid: boolean;
}

/** Every inverter of the NREL SAM "CEC Inverters" library, in library order. */
export const CEC_INVERTERS: readonly CecInverter[] = decodeTable<CecInverter>(data);
