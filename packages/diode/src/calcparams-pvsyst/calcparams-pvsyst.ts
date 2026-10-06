import type { DiodeParams } from "../calcparams-desoto/calcparams-desoto.ts";

/** Boltzmann constant J/K and elementary charge C (exact SI 2019). */
const K = 1.380649e-23;
const Q = 1.602176634e-19;

/**
 * PVsyst single-diode model (Mermoud & Lejeune 2010; Sauer et al. 2015): ideality factor
 * linear in temperature, exponential shunt-resistance irradiance dependence.
 * `γ = γref + μγ·(Tc − Tref)`, `nNsVth = γ·k/q·Ns·Tc`, `IL = S/Sref·(IL,ref + αsc·(Tc − Tref))`,
 * `I0 = I0,ref·(Tc/Tref)³·exp(q·Eg/(k·γ)·(1/Tref − 1/Tc))`,
 * `Rsh = Rsh,base + (Rsh,0 − Rsh,base)·exp(−Rexp·S/Sref)`,
 * `Rsh,base = max(0, (Rsh,ref − Rsh,0·e^(−Rexp)) / (1 − e^(−Rexp)))`.
 *
 * @example
 * calcparamsPvsyst({ effectiveIrradiance: 800, tempCell: 45, alphaSc: 0.0047, gammaRef: 0.98,
 *   muGamma: -0.0003, iLRef: 6.0, iORef: 5e-10, rShRef: 300, rSh0: 1500, rS: 0.5, cellsInSeries: 60 });
 */
export const calcparamsPvsyst = (input: {
  /** Irradiance converted to photocurrent, W/m². */
  effectiveIrradiance: number;
  /** Cell temperature, °C. */
  tempCell: number;
  /** Temperature coefficient of short-circuit current, A/°C. */
  alphaSc: number;
  /** Diode ideality factor at reference, unitless. */
  gammaRef: number;
  /** Temperature coefficient of the ideality factor, 1/K. */
  muGamma: number;
  /** Light-generated current at reference, A. */
  iLRef: number;
  /** Diode saturation current at reference, A. */
  iORef: number;
  /** Shunt resistance at reference irradiance, Ω. */
  rShRef: number;
  /** Shunt resistance at zero irradiance, Ω. */
  rSh0: number;
  /** Series resistance, Ω. */
  rS: number;
  /** Cells in series. */
  cellsInSeries: number;
  /** Shunt-resistance exponent. Default 5.5. */
  rShExp?: number;
  /** Band gap at reference temperature, eV. Default 1.121. */
  egRef?: number;
  /** Reference irradiance, W/m². Default 1000. */
  irradRef?: number;
  /** Reference cell temperature, °C. Default 25. */
  tempRef?: number;
}): DiodeParams => {
  const {
    effectiveIrradiance: s,
    tempCell,
    alphaSc,
    gammaRef,
    muGamma,
    iLRef,
    iORef,
    rShRef,
    rSh0,
    rS,
    cellsInSeries,
    rShExp = 5.5,
    egRef = 1.121,
    irradRef = 1000,
    tempRef = 25,
  } = input;
  const tRef = tempRef + 273.15;
  const tCell = tempCell + 273.15;
  const gamma = gammaRef + muGamma * (tempCell - tempRef);
  const rShBase = Math.max(0, (rShRef - rSh0 * Math.exp(-rShExp)) / (1 - Math.exp(-rShExp)));
  return {
    photocurrent: (s / irradRef) * (iLRef + alphaSc * (tCell - tRef)),
    saturationCurrent:
      iORef * (tCell / tRef) ** 3 * Math.exp(((Q * egRef) / (K * gamma)) * (1 / tRef - 1 / tCell)),
    resistanceSeries: rS,
    resistanceShunt: rShBase + (rSh0 - rShBase) * Math.exp((-rShExp * s) / irradRef),
    nNsVth: ((gamma * K) / Q) * cellsInSeries * tCell,
  };
};
