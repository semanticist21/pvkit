/** Boltzmann constant J/K and elementary charge C (exact SI 2019). */
const K = 1.380649e-23;
const Q = 1.602176634e-19;

/** SAPM electrical coefficients; field names match `@pvkit/spec` `SandiaModule`. */
export interface SapmModule {
  /** Cells in series. */
  cellsInSeries: number;
  /** Short-circuit current at reference, A. */
  isco: number;
  /** Max-power current at reference, A. */
  impo: number;
  /** Open-circuit voltage at reference, V. */
  voco: number;
  /** Max-power voltage at reference, V. */
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
  /** Diode factor, unitless. */
  n: number;
  c0: number;
  c1: number;
  c2: number;
  c3: number;
  c4?: number;
  c5?: number;
  c6?: number;
  c7?: number;
  /** Current at `voc/2` at reference, A. */
  ixo?: number;
  /** Current at `(voc + vmp)/2` at reference, A. */
  ixxo?: number;
}

/**
 * Sandia Array Performance Model (King, Boyson & Kratochvil 2004) key I-V points at an
 * effective irradiance and cell temperature. With `Ee = E/Eref`, `δ = n·k·Tc/q`, `ΔT = Tc − Tref`:
 * `Isc = Isco·Ee·(1 + αIsc·ΔT)`, `Imp = Impo·(C0·Ee + C1·Ee²)·(1 + αImp·ΔT)`,
 * `Voc = max(0, Voco + Ns·δ·ln Ee + βVoc(Ee)·ΔT)`,
 * `Vmp = max(0, Vmpo + C2·Ns·δ·ln Ee + C3·Ns·(δ·ln Ee)² + βVmp(Ee)·ΔT)`, `β(Ee) = β + mβ·(1 − Ee)`;
 * `iX` / `iXx` only when the module has `ixo`, `c4`, `c5` / `ixxo`, `c6`, `c7`.
 *
 * @example
 * sapm({ ...SANDIA_MODULES[0], effectiveIrradiance: 1000, tempCell: 25 }).pMp; // ≈ Impo·Vmpo
 */
export const sapm = (
  input: SapmModule & {
    /** Effective irradiance reaching the cells, W/m² (`sapmEffectiveIrradiance`). */
    effectiveIrradiance: number;
    /** Cell temperature, °C. */
    tempCell: number;
    /** Reference cell temperature, °C. Default 25. */
    tempRef?: number;
    /** Reference irradiance, W/m². Default 1000. */
    irradRef?: number;
  },
): {
  iSc: number;
  iMp: number;
  vOc: number;
  vMp: number;
  pMp: number;
  iX?: number;
  iXx?: number;
} => {
  const m = input;
  const { tempCell, tempRef = 25, irradRef = 1000 } = m;
  const ee = m.effectiveIrradiance / irradRef;
  const dt = tempCell - tempRef;
  const bvmpo = m.bvmpo + m.mbvmp * (1 - ee);
  const bvoco = m.bvoco + m.mbvoc * (1 - ee);
  const delta = (m.n * K * (tempCell + 273.15)) / Q;
  const logEe = ee === 0 ? Number.NEGATIVE_INFINITY : Math.log(ee); // NaN for ee < 0, as pvlib
  const ns = m.cellsInSeries;
  const iMp = m.impo * (m.c0 * ee + m.c1 * ee ** 2) * (1 + m.aimp * dt);
  const vMp = Math.max(
    0,
    m.vmpo + m.c2 * ns * delta * logEe + m.c3 * ns * (delta * logEe) ** 2 + bvmpo * dt,
  );
  const out: ReturnType<typeof sapm> = {
    iSc: m.isco * ee * (1 + m.aisc * dt),
    iMp,
    vOc: Math.max(0, m.voco + ns * delta * logEe + bvoco * dt),
    vMp,
    pMp: iMp * vMp,
  };
  if (m.ixo !== undefined && m.c4 !== undefined && m.c5 !== undefined) {
    out.iX = m.ixo * (m.c4 * ee + m.c5 * ee ** 2) * (1 + m.aisc * dt);
  }
  if (m.ixxo !== undefined && m.c6 !== undefined && m.c7 !== undefined) {
    out.iXx = m.ixxo * (m.c6 * ee + m.c7 * ee ** 2) * (1 + m.aimp * dt);
  }
  return out;
};
