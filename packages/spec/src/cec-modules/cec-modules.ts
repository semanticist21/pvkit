import { decodeTable } from "../table.ts";
import data from "./cec-modules-data.json" with { type: "json" };

/** One module of the CEC module list with its CEC 6-parameter single-diode fit (STC values). */
export interface CecModule {
  /** Manufacturer + model, as listed (not unique: 36 names repeat). */
  name: string;
  manufacturer: string;
  /** Cell technology as listed, e.g. "Mono-c-Si", "Multi-c-Si", "CdTe", "Thin Film". */
  technology: string;
  bifacial: boolean;
  /** Building-integrated PV. */
  bipv: boolean;
  /** Nameplate DC power at STC, W. */
  stc: number;
  /** Power at PVUSA test conditions, W. */
  ptc: number;
  /** Module area, m². */
  area: number;
  /** Module length, m (absent for most older entries). */
  length?: number;
  /** Module width, m (absent for most older entries). */
  width?: number;
  /** Cells in series (absent for one entry). */
  cellsInSeries?: number;
  /** Short-circuit current at STC, A. */
  isc: number;
  /** Open-circuit voltage at STC, V. */
  voc: number;
  /** Max-power current at STC, A. */
  imp: number;
  /** Max-power voltage at STC, V. */
  vmp: number;
  /** Temperature coefficient of `isc`, A/°C. */
  alphaSc: number;
  /** Temperature coefficient of `voc`, V/°C. */
  betaOc: number;
  /** Temperature coefficient of max power, 1/°C (SAM lists %/°C; divided by 100). */
  gammaPmp: number;
  /** Nominal operating cell temperature, °C. */
  noct: number;
  /** Modified diode ideality factor at reference conditions, V. */
  aRef: number;
  /** Light-generated current at reference conditions, A. */
  iLRef: number;
  /** Diode saturation current at reference conditions, A. */
  iORef: number;
  /** Series resistance, Ω. */
  rS: number;
  /** Shunt resistance at reference conditions, Ω. */
  rShRef: number;
  /** CEC adjustment to the temperature coefficient of `isc`, % (as calcparams_cec takes it). */
  adjust: number;
}

/** Every module of the NREL SAM "CEC Modules" library, in library order. */
export const CEC_MODULES: readonly CecModule[] = decodeTable<CecModule>(data);
