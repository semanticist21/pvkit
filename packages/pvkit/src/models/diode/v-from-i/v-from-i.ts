import type { DiodeParams } from "../calcparams-desoto/calcparams-desoto.ts";
import { lambertWExp } from "../lambert-w.ts";

/**
 * Voltage at a given current on the single-diode I-V curve, exact via Lambert W
 * (Jain & Kapoor 2004): with `Gsh = 1/Rsh`,
 * `V = (IL + I0 − I)/Gsh − I·Rs − nNsVth·W(I0/(Gsh·nNsVth) · exp((IL + I0 − I)/(Gsh·nNsVth)))`;
 * for `Rsh = ∞`, `V = nNsVth·ln(1 + (IL − I)/I0) − I·Rs`. W is evaluated from the logarithm of
 * its argument (no overflow at large `Rsh`).
 *
 * @example
 * vFromI({ current: 0, ...params }); // open-circuit voltage
 */
export const vFromI = (
  input: DiodeParams & { /** Terminal current, A. */ current: number },
): number => {
  const {
    current: i,
    photocurrent: il,
    saturationCurrent: i0,
    resistanceSeries: rs,
    nNsVth: a,
  } = input;
  const gsh = 1 / input.resistanceShunt;
  if (gsh === 0) return a * Math.log1p((il - i) / i0) - i * rs;
  const logArg = Math.log(i0) - Math.log(gsh) - Math.log(a) + (il + i0 - i) / (gsh * a);
  return (il + i0 - i) / gsh - i * rs - a * lambertWExp(logArg);
};
