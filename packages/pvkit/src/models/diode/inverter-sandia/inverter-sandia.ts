/**
 * Sandia grid-connected inverter model (King et al. 2007). With `ΔV = Vdc − Vdco`,
 * `A = Pdco·(1 + C1·ΔV)`, `B = Pso·(1 + C2·ΔV)`, `C = C0·(1 + C3·ΔV)`:
 * `Pac = (Paco/(A − B) − C·(A − B))·(Pdc − B) + C·(Pdc − B)²`, clipped at `Paco`;
 * `Pdc < Pso` → `−|Pnt|` (night tare). Coefficient names match `@pvkit/spec` `CecInverter`.
 *
 * @example
 * inverterSandia({ vdc: 400, pdc: 3000, ...CEC_INVERTERS[0] });
 */
export const inverterSandia = (input: {
  /** DC input voltage, V. */
  vdc: number;
  /** DC input power, W. */
  pdc: number;
  /** Max AC power, W. */
  paco: number;
  /** DC power at which `paco` is reached, W. */
  pdco: number;
  /** DC voltage at which the coefficients were fit, V. */
  vdco: number;
  /** DC power to start inverting, W. */
  pso: number;
  /** Curvature of the AC-vs-DC power curve, 1/W. */
  c0: number;
  /** Voltage dependence of `pdco`, 1/V. */
  c1: number;
  /** Voltage dependence of `pso`, 1/V. */
  c2: number;
  /** Voltage dependence of `c0`, 1/V. */
  c3: number;
  /** Night-tare AC consumption, W (positive). Default 0 (absent in some library rows). */
  pnt?: number;
}): number => {
  const { vdc, pdc, paco, pdco, vdco, pso, c0, c1, c2, c3, pnt = 0 } = input;
  if (pdc < pso) return -Math.abs(pnt);
  const dv = vdc - vdco;
  const a = pdco * (1 + c1 * dv);
  const b = pso * (1 + c2 * dv);
  const c = c0 * (1 + c3 * dv);
  return Math.min(paco, (paco / (a - b) - c * (a - b)) * (pdc - b) + c * (pdc - b) ** 2);
};
