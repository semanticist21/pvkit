/**
 * Driesse (2008) "ADR" inverter efficiency model. With `p = Pdc/Pnom`, `v = Vdc/Vnom`, the loss is
 * `ploss = Σ b_k·φ_k` over `φ = [1, p, p², v−1, p(v−1), p²(v−1), 1/v−1, p(1/v−1), p²(1/v−1)]`
 * and `Pac = Pnom·(p − ploss)`, limited to `[−|Pnt|, Pacmax]`. `Vdc = 0` → `−|Pnt|`; `Vdc`
 * outside `[max(Vmin, MPPTLow)·(1 − vtol), max(Vmax, Vdcmax, MPPTHi)·(1 + vtol)]` → NaN.
 *
 * @example
 * inverterAdr({ vdc: 396, pdc: 1500, pNom: 2200, vNom: 396, pacMax: 2110, pnt: 0.25,
 *   adrCoefficients: [0.01385, 0.0152, 0.00794, 0.00286, -0.01872, -0.01305, 0, 0, 0],
 *   vMax: 413, vMin: 155, vdcMax: 500, mpptHigh: 450, mpptLow: 150 });
 */
export const inverterAdr = (input: {
  /** DC input voltage, V. */
  vdc: number;
  /** DC input power, W. */
  pdc: number;
  /** Nominal DC power used to normalize `pdc`, W. */
  pNom: number;
  /** Nominal DC voltage used to normalize `vdc`, V. */
  vNom: number;
  /** Max AC power, W. */
  pacMax: number;
  /** Night-tare AC consumption, W. */
  pnt: number;
  /** The nine ADR loss coefficients `b_0…b_8`. */
  adrCoefficients: ArrayLike<number>;
  /** Max / min AC-rated DC voltage, V. */
  vMax: number;
  vMin: number;
  /** Max DC input voltage, V. */
  vdcMax: number;
  /** MPPT voltage window, V. */
  mpptHigh: number;
  mpptLow: number;
  /** Fractional tolerance on the voltage limits. Default 0.1. */
  vtol?: number;
}): number => {
  const { vdc, pdc, pNom, vNom, pacMax, adrCoefficients: b, vtol = 0.1 } = input;
  if (b.length !== 9) throw new RangeError(`adrCoefficients needs 9 values, got ${b.length}`);
  const pnt = -Math.abs(input.pnt);
  // np.nanmax: NaN limits are ignored
  const nanMax = (...xs: number[]) => Math.max(...xs.filter((x) => !Number.isNaN(x)));
  const upper = nanMax(input.vMax, input.vdcMax, input.mpptHigh) * (1 + vtol);
  const lower = nanMax(input.vMin, input.mpptLow) * (1 - vtol);
  const p = pdc / pNom;
  const v = vdc / vNom;
  if (v === 0) return Math.min(pnt, pacMax);
  if (upper < vdc || vdc < lower) return Number.NaN;
  const phi = [
    1,
    p,
    p * p,
    v - 1,
    p * (v - 1),
    p * p * (v - 1),
    1 / v - 1,
    p * (1 / v - 1),
    p * p * (1 / v - 1),
  ];
  let loss = 0;
  for (let k = 0; k < 9; k++) loss += (b[k] as number) * (phi[k] as number);
  return Math.min(Math.max(pNom * (p - loss), pnt), pacMax);
};
