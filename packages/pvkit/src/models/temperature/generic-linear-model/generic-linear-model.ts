/**
 * Parameters of the generic linear model — spreadable into `genericLinear`
 * (`pvkit-js/temperature/generic-linear`).
 */
export interface GenericLinearParameters {
  /** Combined heat-transfer coefficient at zero wind, W/(m²·K). */
  uConst: number;
  /** Wind influence on the heat-transfer coefficient, W/(m²·K·m/s). */
  duWind: number;
  /** Module electrical efficiency η, fraction. */
  moduleEfficiency: number;
  /** Module light absorptance α, fraction; > `moduleEfficiency`. */
  absorptance: number;
}

/** Module properties every conversion needs. Representative of high irradiance. */
interface ModuleProperties {
  /** Module electrical efficiency η, fraction. */
  moduleEfficiency: number;
  /** Module light absorptance α, fraction; > `moduleEfficiency`. */
  absorptance: number;
}

/** SAPM fit wind speeds (10 m), m/s. Defaults 1.4 and 5.4 (Driesse et al. 2022). */
interface WindFit {
  /** Lower wind speed of the linear fit, m/s. Default 1.4. */
  windFitLow?: number;
  /** Upper wind speed of the linear fit, m/s. Default 5.4. */
  windFitHigh?: number;
}

/** α − η, the absorbed fraction that ends up as heat; validated > 0. */
const netAbsorptance = ({ moduleEfficiency, absorptance }: ModuleProperties): number => {
  const net = absorptance - moduleEfficiency;
  if (!(net > 0)) {
    throw new RangeError(
      `absorptance (${absorptance}) must exceed moduleEfficiency (${moduleEfficiency})`,
    );
  }
  return net;
};

/** PVsyst heats with α(1 − η) instead of α − η; ratio (α − η) / (α(1 − η)). */
const pvsystRatio = (p: ModuleProperties): number =>
  netAbsorptance(p) / (p.absorptance * (1 - p.moduleEfficiency));

/** Faiman `u0`, `u1` → generic linear parameters. */
export const genericLinearFromFaiman = (
  input: { u0: number; u1: number } & ModuleProperties,
): GenericLinearParameters => {
  const { u0, u1, moduleEfficiency, absorptance } = input;
  const net = netAbsorptance(input);
  return { uConst: u0 * net, duWind: u1 * net, moduleEfficiency, absorptance };
};

/** Generic linear parameters → Faiman `u0`, `u1` (spreadable into `faiman`). */
export const genericLinearToFaiman = (
  input: GenericLinearParameters,
): { u0: number; u1: number } => {
  const net = netAbsorptance(input);
  return { u0: input.uConst / net, u1: input.duWind / net };
};

/** PVsyst `uC`, `uV` (with `moduleEfficiency`, `alphaAbsorption`) → generic linear parameters. */
export const genericLinearFromPvsyst = (input: {
  uC: number;
  uV: number;
  moduleEfficiency: number;
  alphaAbsorption: number;
}): GenericLinearParameters => {
  const { uC, uV, moduleEfficiency, alphaAbsorption: absorptance } = input;
  const ratio = pvsystRatio({ moduleEfficiency, absorptance });
  return { uConst: uC * ratio, duWind: uV * ratio, moduleEfficiency, absorptance };
};

/** Generic linear parameters → PVsyst parameters (spreadable into `pvsystCell`). */
export const genericLinearToPvsyst = (
  input: GenericLinearParameters,
): { uC: number; uV: number; moduleEfficiency: number; alphaAbsorption: number } => {
  const ratio = pvsystRatio(input);
  return {
    uC: input.uConst / ratio,
    uV: input.duWind / ratio,
    moduleEfficiency: input.moduleEfficiency,
    alphaAbsorption: input.absorptance,
  };
};

/** NOCT measured with ~1 m/s at module height; 0.51 scales the wind term to 10 m wind. */
const NOCT_WIND_ADJ = 0.51;

/** SAM NOCT (with `moduleEfficiency`, `transmittanceAbsorptance`) → generic linear parameters. */
export const genericLinearFromNoctSam = (input: {
  noct: number;
  moduleEfficiency: number;
  transmittanceAbsorptance: number;
}): GenericLinearParameters => {
  const { noct, moduleEfficiency, transmittanceAbsorptance: absorptance } = input;
  const uNoct = (800 * absorptance) / (noct - 20);
  return {
    uConst: uNoct * 0.6,
    duWind: uNoct * 0.4 * NOCT_WIND_ADJ,
    moduleEfficiency,
    absorptance,
  };
};

/** Generic linear parameters → SAM NOCT parameters (spreadable into `noctSam`). */
export const genericLinearToNoctSam = (
  input: GenericLinearParameters,
): { noct: number; moduleEfficiency: number; transmittanceAbsorptance: number } => {
  const uNoct = input.uConst + input.duWind / NOCT_WIND_ADJ;
  return {
    noct: 20 + (800 * input.absorptance) / uNoct,
    moduleEfficiency: input.moduleEfficiency,
    transmittanceAbsorptance: input.absorptance,
  };
};

/**
 * SAPM module-temperature `a`, `b` → generic linear parameters, by a straight line through
 * the SAPM heat-transfer coefficient `1/exp(a + b·WS)` at `windFitLow` and `windFitHigh`.
 */
export const genericLinearFromSapm = (
  input: { a: number; b: number } & ModuleProperties & WindFit,
): GenericLinearParameters => {
  const { a, b, moduleEfficiency, absorptance, windFitLow = 1.4, windFitHigh = 5.4 } = input;
  const uLow = 1 / Math.exp(a + b * windFitLow);
  const uHigh = 1 / Math.exp(a + b * windFitHigh);
  const duWind = (uHigh - uLow) / (windFitHigh - windFitLow);
  const uConst = uLow - duWind * windFitLow;
  const net = netAbsorptance(input);
  return { uConst: uConst * net, duWind: duWind * net, moduleEfficiency, absorptance };
};

/** Generic linear parameters → SAPM `a`, `b` (spreadable into `sapmModule`). */
export const genericLinearToSapm = (
  input: GenericLinearParameters & WindFit,
): { a: number; b: number } => {
  const { windFitLow = 1.4, windFitHigh = 5.4 } = input;
  const net = netAbsorptance(input);
  const uConst = input.uConst / net;
  const duWind = input.duWind / net;
  const uLow = uConst + duWind * windFitLow;
  const uHigh = uConst + duWind * windFitHigh;
  const b = -(Math.log(uHigh) - Math.log(uLow)) / (windFitHigh - windFitLow);
  return { a: -(Math.log(uLow) + b * windFitLow), b };
};
