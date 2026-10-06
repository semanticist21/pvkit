import type { DiodeParams } from "../calcparams-desoto/calcparams-desoto.ts";
import { lambertWExp } from "../lambert-w.ts";

/**
 * Current at a given voltage on the single-diode I-V curve, exact via Lambert W
 * (Jain & Kapoor 2004): with `Gsh = 1/Rsh`, `D = Rs·Gsh + 1`,
 * `I = (IL + I0 − V·Gsh)/D − (nNsVth/Rs)·W(Rs·I0/(nNsVth·D) · exp((Rs·(IL + I0) + V)/(nNsVth·D)))`;
 * for `Rs = 0`, `I = IL − I0·(exp(V/nNsVth) − 1) − Gsh·V`. W is evaluated from the
 * logarithm of its argument, so large `V` stays finite where pvlib's overflows to NaN.
 *
 * @example
 * iFromV({ voltage: 0, ...params }); // short-circuit current
 */
export const iFromV = (
  input: DiodeParams & { /** Terminal voltage, V. */ voltage: number },
): number => {
  const {
    voltage: v,
    photocurrent: il,
    saturationCurrent: i0,
    resistanceSeries: rs,
    nNsVth: a,
  } = input;
  const gsh = 1 / input.resistanceShunt;
  if (rs === 0) return il - i0 * Math.expm1(v / a) - gsh * v;
  const d = rs * gsh + 1;
  const logArg = Math.log((rs * i0) / (a * d)) + (rs * (il + i0) + v) / (a * d);
  return (il + i0 - v * gsh) / d - (a / rs) * lambertWExp(logArg);
};
