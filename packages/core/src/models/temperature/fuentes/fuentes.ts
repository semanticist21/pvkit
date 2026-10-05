/** Inputs for one {@link fuentes} step. */
export interface FuentesInput {
  /** Plane-of-array irradiance at this step, W/m². */
  poaGlobal: number;
  /** Ambient dry-bulb air temperature at this step, °C. */
  tempAir: number;
  /** Wind speed at `windHeight` at this step, m/s. */
  windSpeed: number;
  /** Installed nominal operating cell temperature, °C (PVWatts: 45 rack, 49 roof); > 20. */
  noctInstalled: number;
  /** Module temperature returned by the previous step, °C. Before the first step: 20. */
  prevModuleTemperature: number;
  /** `poaGlobal` of the previous step, W/m². Before the first step: 0. */
  prevPoaGlobal: number;
  /** Time since the previous step, seconds; > 0. For the first step use the second interval. */
  timestepSeconds: number;
  /** Height of the module centre above ground, m. Default 5 (PVWatts). */
  moduleHeight?: number;
  /** Height of the wind measurement, m. Default 9.144 (PVWatts). */
  windHeight?: number;
  /** Thermal emissivity, unitless. Default 0.84. */
  emissivity?: number;
  /** Fraction of irradiance turned into heat, unitless. Default 0.83. */
  absorption?: number;
  /** Module tilt from horizontal, degrees. Default 30. */
  surfaceTilt?: number;
  /** Module width, m. Default 0.31579 (with the default length: hydraulic diameter 0.5 m). */
  moduleWidth?: number;
  /** Module length, m. Default 1.2. */
  moduleLength?: number;
}

const BOLTZ = 5.669e-8; // Stefan–Boltzmann constant as printed in Fuentes (1987)
const K = 273.15;
const CAP0 = 11_000; // module heat capacity per area, J/(m²·K)
const D2R = Math.PI / 180;

/** Convective coefficient: free + laminar/turbulent forced convection (Fuentes 1987). */
const hConvection = (
  tave: number,
  windmod: number,
  tempDelta: number,
  xlen: number,
  sinTilt: number,
  checkReynold: boolean,
): number => {
  const densair = (0.003484 * 101_325) / tave;
  const visair = (0.24237e-6 * tave ** 0.76) / densair;
  const condair = 2.1695e-4 * tave ** 0.84;
  const reynold = (windmod * xlen) / visair;
  const hforce =
    checkReynold && reynold > 1.2e5
      ? ((0.0282 / reynold ** 0.2) * densair * windmod * 1007) / 0.71 ** 0.4
      : ((0.86 / reynold ** 0.5) * densair * windmod * 1007) / 0.71 ** 0.67;
  const grashof = (((9.8 / tave) * tempDelta * xlen ** 3) / visair ** 2) * sinTilt;
  const hfree = (0.21 * (grashof * 0.71) ** 0.32 * condair) / xlen;
  return Math.cbrt(hfree ** 3 + hforce ** 3);
};

/**
 * One timestep of the Fuentes (1987) transient heat-balance model (used by PVWatts):
 * module temperature, °C, from this step's weather plus the previous step's state.
 * The caller iterates, feeding each result back as `prevModuleTemperature`.
 *
 * @example
 * let prevModuleTemperature = 20, prevPoaGlobal = 0;
 * for (const w of weather) {
 *   prevModuleTemperature = fuentes({ ...w, noctInstalled: 45, prevModuleTemperature, prevPoaGlobal, timestepSeconds: 3600 });
 *   prevPoaGlobal = w.poaGlobal;
 * }
 */
export const fuentes = (input: FuentesInput): number => {
  const {
    poaGlobal,
    tempAir,
    windSpeed,
    noctInstalled,
    prevModuleTemperature,
    prevPoaGlobal,
    timestepSeconds,
    moduleHeight = 5,
    windHeight = 9.144,
    emissivity = 0.84,
    absorption = 0.83,
    surfaceTilt = 30,
    moduleWidth = 0.31579,
    moduleLength = 1.2,
  } = input;
  if (!(noctInstalled > 20))
    throw new RangeError(`noctInstalled must be > 20 °C: ${noctInstalled}`);
  if (!(timestepSeconds > 0) || !Number.isFinite(timestepSeconds)) {
    throw new RangeError(`timestepSeconds must be finite and > 0: ${timestepSeconds}`);
  }

  const xlen = (2 * moduleWidth * moduleLength) / (moduleWidth + moduleLength);
  const sinTilt = Math.sin(surfaceTilt * D2R);

  // Calibration at installed NOCT (800 W/m², 20 °C air, 1 m/s, sky 282.21 K).
  const tinoct = noctInstalled + K;
  const t20 = 293.15;
  const hconvNoct = hConvection((tinoct + t20) / 2, 1, tinoct - t20, xlen, sinTilt, false);
  const hgroundNoct = emissivity * BOLTZ * (tinoct ** 2 + t20 ** 2) * (tinoct + t20);
  const backrat =
    (absorption * 800 -
      emissivity * BOLTZ * (tinoct ** 4 - 282.21 ** 4) -
      hconvNoct * (tinoct - t20)) /
    ((hgroundNoct + hconvNoct) * (tinoct - t20));
  const tgroundNoct = Math.min(
    Math.max((tinoct ** 4 - backrat * (tinoct ** 4 - t20 ** 4)) ** 0.25, t20),
    tinoct,
  );
  const tgrat = (tgroundNoct - t20) / (tinoct - t20);
  const convrat =
    (absorption * 800 - emissivity * BOLTZ * (2 * tinoct ** 4 - 282.21 ** 4 - tgroundNoct ** 4)) /
    (hconvNoct * (tinoct - t20));
  // High INOCT implies coupling to racking/roof → more thermal mass (Table 3, eqs. 26–27).
  const cap = tinoct > 321.15 ? CAP0 * (1 + (tinoct - 321.15) / 12) : CAP0;

  const tamb = tempAir + K;
  const sun = poaGlobal * absorption;
  const sun0 = prevPoaGlobal * absorption;
  const tsky = 0.68 * (0.0552 * tamb ** 1.5) + 0.32 * tamb; // eq. 24
  const windmod = windSpeed * (moduleHeight / windHeight) ** 0.2 + 1e-4; // eq. 22
  const tmod0 = prevModuleTemperature + K;

  // Heat losses depend on tmod → fixed-point iteration (10 passes, as the FORTRAN).
  let tmod = tmod0;
  for (let j = 0; j < 10; j++) {
    const hconv =
      convrat * hConvection((tmod + tamb) / 2, windmod, Math.abs(tmod - tamb), xlen, sinTilt, true);
    const hsky = emissivity * BOLTZ * (tmod ** 2 + tsky ** 2) * (tmod + tsky); // eq. 3
    const tground = tamb + tgrat * (tmod - tamb);
    const hground = emissivity * BOLTZ * (tmod ** 2 + tground ** 2) * (tmod + tground); // eq. 4
    const hsum = hconv + hsky + hground;
    const eigen = (-hsum / cap) * timestepSeconds; // eq. 8
    const ex = eigen > -10 ? Math.exp(eigen) : 0;
    // eq. 7 (sun, sun0 already include absorption)
    tmod =
      tmod0 * ex +
      ((1 - ex) * (hconv * tamb + hsky * tsky + hground * tground + sun0 + (sun - sun0) / eigen) +
        sun -
        sun0) /
        hsum;
  }
  return tmod - K;
};
