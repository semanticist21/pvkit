/** Inputs for {@link pvwattsInverter}. `pdc` and `pdc0` share a unit (W). */
export interface PvwattsInverterInput {
  /** DC input power, W. */
  pdc: number;
  /** Inverter DC input limit, W (not the array's `pdc0`). Must be > 0. */
  pdc0: number;
  /** Nominal inverter efficiency. Default 0.96 (pvlib default). */
  etaInvNom?: number;
  /** Reference inverter efficiency. Default 0.9637 (PVWatts definition, pvlib default). */
  etaInvRef?: number;
}

/**
 * PVWatts inverter (Dobos 2014). With `ζ = pdc/pdc0`:
 * `η = ηnom/ηref · (−0.0162ζ − 0.0059/ζ + 0.9858)`,
 * `pac = max(0, min(ηnom·pdc0, η·pdc))`, W.
 * `pdc = 0` → 0; low power where η < 0 (ζ < ~0.006) or negative `pdc` → 0, as in pvlib.
 *
 * @example
 * pvwattsInverter({ pdc: 8000, pdc0: 5000 }); // 4800 (clipped at ηnom·pdc0)
 */
export const pvwattsInverter = (input: PvwattsInverterInput): number => {
  const { pdc, pdc0, etaInvNom = 0.96, etaInvRef = 0.9637 } = input;
  if (!(pdc0 > 0)) throw new RangeError(`pdc0 must be > 0, got ${pdc0}`);
  const pac0 = etaInvNom * pdc0;
  const zeta = pdc / pdc0;
  // pvlib zeroes the 0.0059/ζ term at pdc == 0 (input compare, not a computed float).
  const eta = (etaInvNom / etaInvRef) * (-0.0162 * zeta - (pdc === 0 ? 0 : 0.0059 / zeta) + 0.9858);
  return Math.max(0, Math.min(pac0, eta * pdc));
};
