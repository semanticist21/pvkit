/** Boltzmann constant, eV/K: exact SI k / e (CODATA 2018+; what scipy.constants returns). */
const K_EV = 1.380649e-23 / 1.602176634e-19;

/** The five single-diode parameters at one operating condition (input to `singleDiode`). */
export interface DiodeParams {
  /** Light-generated current, A. */
  photocurrent: number;
  /** Diode saturation current, A. */
  saturationCurrent: number;
  /** Series resistance, Ω. */
  resistanceSeries: number;
  /** Shunt resistance, Ω (`Infinity` at zero irradiance). */
  resistanceShunt: number;
  /** `n · Ns · Vth` — ideality × cells in series × thermal voltage, V. */
  nNsVth: number;
}

/** Reference-condition fit of the De Soto / CEC model; field names match `@pvkit/spec` `CecModule`. */
export interface DesotoModule {
  /** Temperature coefficient of short-circuit current, A/°C. */
  alphaSc: number;
  /** Modified ideality factor `n·Ns·Vth` at reference, V. */
  aRef: number;
  /** Light-generated current at reference, A. */
  iLRef: number;
  /** Diode saturation current at reference, A. */
  iORef: number;
  /** Shunt resistance at reference, Ω. */
  rShRef: number;
  /** Series resistance, Ω. */
  rS: number;
}

/** Operating condition and band-gap options shared by the De Soto and CEC models. */
export interface DesotoConditions {
  /** Irradiance converted to photocurrent, W/m². */
  effectiveIrradiance: number;
  /** Cell temperature, °C. */
  tempCell: number;
  /** Band gap at reference temperature, eV. Default 1.121 (c-Si; implicit in the CEC fits). */
  egRef?: number;
  /** Band-gap temperature dependence, 1/K. Default −0.0002677 (c-Si). */
  dEgdT?: number;
  /** Reference irradiance, W/m². Default 1000. */
  irradRef?: number;
  /** Reference cell temperature, °C. Default 25. */
  tempRef?: number;
}

/**
 * De Soto et al. (2006) five-parameter model: translates reference-condition single-diode
 * parameters to an operating irradiance and cell temperature.
 * `IL = S/Sref·(IL,ref + αsc·(Tc − Tref))`, `I0 = I0,ref·(Tc/Tref)³·exp(Eg,ref/(k·Tref) − Eg/(k·Tc))`,
 * `Eg = Eg,ref·(1 + dEgdT·(Tc − Tref))`, `Rsh = Rsh,ref·Sref/S`, `nNsVth = aref·Tc/Tref`.
 *
 * @example
 * const p = calcparamsDesoto({ effectiveIrradiance: 800, tempCell: 45, ...module });
 * singleDiode(p).pMp;
 */
export const calcparamsDesoto = (input: DesotoModule & DesotoConditions): DiodeParams => {
  const {
    effectiveIrradiance: s,
    tempCell,
    alphaSc,
    aRef,
    iLRef,
    iORef,
    rShRef,
    rS,
    egRef = 1.121,
    dEgdT = -0.0002677,
    irradRef = 1000,
    tempRef = 25,
  } = input;
  const tRef = tempRef + 273.15;
  const tCell = tempCell + 273.15;
  const eg = egRef * (1 + dEgdT * (tCell - tRef));
  return {
    photocurrent: (s / irradRef) * (iLRef + alphaSc * (tCell - tRef)),
    saturationCurrent:
      iORef * (tCell / tRef) ** 3 * Math.exp(egRef / (K_EV * tRef) - eg / (K_EV * tCell)),
    resistanceSeries: rS,
    resistanceShunt: rShRef * (irradRef / s), // S = 0 → Infinity, as pvlib
    nNsVth: aRef * (tCell / tRef),
  };
};
