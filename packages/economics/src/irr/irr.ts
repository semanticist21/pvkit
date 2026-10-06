import { compensatedSum } from "../sum.ts";

/** Grid step and reach in g = ln(1 + r): r from −0.99995 to ≈ 22 025 (−100 % … +2.2 M %). */
const STEP = 0.005;
const REACH = 10;

/**
 * Internal rate of return: the `r > −1` with `Σ CF_t / (1 + r)^t = 0`. When several rates
 * solve it (non-conventional flows), returns the one closest to 0, as numpy-financial
 * `irr` does; `NaN` when none does. Roots are bracketed on a grid in `ln(1 + r)` scanned
 * outward from 0, then bisected to full float64 precision; a root where NPV only touches
 * 0 without changing sign is not found.
 *
 * @example
 * irr({ cashFlows: [-100, 39, 59, 55, 20] }); // 0.28095…
 */
export const irr = (input: {
  /** Cash flow per period, year 0 first (investment negative). */
  cashFlows: ArrayLike<number>;
}): number => {
  const cf = Array.from(input.cashFlows);
  const f = (g: number) => compensatedSum(cf.map((c, t) => c * Math.exp(-g * t)));
  const f0 = f(0);
  if (f0 === 0) return 0;
  const side = (dir: 1 | -1): number => {
    let a = 0;
    let fa = f0;
    for (let k = 1; k * STEP <= REACH; k++) {
      let b = dir * k * STEP;
      let fb = f(b);
      if (!Number.isFinite(fb)) return Number.NaN;
      if (fb === 0) return b;
      if (fa < 0 !== fb < 0) {
        // bisect until the bracket is two adjacent floats
        for (;;) {
          const m = (a + b) / 2;
          if (m === a || m === b) return Math.abs(fa) < Math.abs(fb) ? a : b;
          const fm = f(m);
          if (fm === 0) return m;
          if (fm < 0 === fa < 0) [a, fa] = [m, fm];
          else [b, fb] = [m, fm];
        }
      }
      [a, fa] = [b, fb];
    }
    return Number.NaN;
  };
  const up = Math.expm1(side(1));
  const down = Math.expm1(side(-1));
  if (Number.isNaN(up)) return down;
  if (Number.isNaN(down)) return up;
  return Math.abs(up) <= Math.abs(down) ? up : down;
};
