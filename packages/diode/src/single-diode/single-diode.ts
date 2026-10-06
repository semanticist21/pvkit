import type { DiodeParams } from "../calcparams-desoto/calcparams-desoto.ts";
import { iFromV } from "../i-from-v/i-from-v.ts";
import { vFromI } from "../v-from-i/v-from-i.ts";

/** Key points of a single-diode I-V curve (A, V, W). */
export interface IvPoints {
  /** Short-circuit current, A. */
  iSc: number;
  /** Open-circuit voltage, V. */
  vOc: number;
  /** Current at maximum power, A. */
  iMp: number;
  /** Voltage at maximum power, V. */
  vMp: number;
  /** Maximum power, W. */
  pMp: number;
  /** Current at `vOc / 2`, A. */
  iX: number;
  /** Current at `(vOc + vMp) / 2`, A. */
  iXx: number;
}

/**
 * Solves the single-diode equation `I = IL − I0·(exp((V + I·Rs)/nNsVth) − 1) − (V + I·Rs)/Rsh`
 * for the Sandia key points. `iSc`, `vOc`, `iX`, `iXx` are exact (Lambert W, `iFromV` /
 * `vFromI`). The maximum power point is found in the diode voltage `Vd = V + I·Rs`
 * (Bishop 1988 explicit form): `dP/dV = 0` solved by Newton with bisection fallback on
 * `[0, nNsVth·ln(1 + IL/I0)]` to float64 precision.
 *
 * @example
 * singleDiode(calcparamsCec({ ...module, effectiveIrradiance: 1000, tempCell: 25 })).pMp;
 */
export const singleDiode = (params: DiodeParams): IvPoints => {
  const { photocurrent: il, saturationCurrent: i0, resistanceSeries: rs, nNsVth: a } = params;
  const gsh = 1 / params.resistanceShunt;
  const iSc = iFromV({ ...params, voltage: 0 });
  let vOc = vFromI({ ...params, current: 0 });
  if (vOc < 0 && vOc > -1e-12) vOc = 0; // as pvlib: rounding at zero irradiance

  // Bishop 1988: current, voltage and dP/dV (+ derivative) as functions of the diode voltage.
  const point = (vd: number) => {
    const i = il - i0 * Math.expm1(vd / a) - vd * gsh;
    return { i, v: vd - i * rs };
  };
  const dp = (vd: number) => {
    const { i, v } = point(vd);
    const gDiode = (i0 * Math.exp(vd / a)) / a;
    const gradI = -gDiode - gsh;
    const gradV = 1 - gradI * rs;
    const grad = gradI / gradV;
    const grad2i = -gDiode / a;
    const grad2v = -grad2i * rs;
    const grad2p = gradV * grad + v * (grad2i / gradV - (gradI * grad2v) / gradV ** 2) + gradI;
    return { f: v * grad + i, df: grad2p };
  };
  let lo = 0;
  let hi = a * Math.log1p(il / i0);
  let vd = 0;
  if (hi > 0) {
    // dP/dV > 0 at Vd = 0 (I = IL) and < 0 at Vd = Voc,est (I < 0): one root in between.
    vd = hi;
    for (let k = 0; k < 200; k++) {
      const { f, df } = dp(vd);
      if (f === 0) break;
      if (f > 0) lo = vd;
      else hi = vd;
      let next = vd - f / df;
      if (!(next > lo && next < hi)) next = (lo + hi) / 2;
      if (
        Math.abs(next - vd) <= 2 * Number.EPSILON * Math.abs(next) ||
        next === lo ||
        next === hi
      ) {
        vd = next;
        break;
      }
      vd = next;
    }
  }
  const { i: iMp, v: vMp } = point(vd);
  return {
    iSc,
    vOc,
    iMp,
    vMp,
    pMp: iMp * vMp,
    iX: iFromV({ ...params, voltage: vOc / 2 }),
    iXx: iFromV({ ...params, voltage: (vOc + vMp) / 2 }),
  };
};
