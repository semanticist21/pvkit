import { assertFinite } from "../finite.ts";
import { compensatedSum } from "../sum.ts";

/**
 * Sign-faithful value of `Σ c_t x^t` for `x > 0`: for `x > 1` it evaluates `x^−n` times the
 * polynomial instead, so neither form overflows.
 */
const value = (c: number[], x: number): number => {
  const n = c.length - 1;
  return compensatedSum(c.map((ct, t) => ct * x ** (x <= 1 ? t : t - n)));
};

/** Bisect a sign change of `p` on `[a, b]` until the bracket is two adjacent floats. */
const bisect = (c: number[], a: number, b: number, fa: number, fb: number): number => {
  for (;;) {
    const m = a + (b - a) / 2;
    if (m === a || m === b) return Math.abs(fa) <= Math.abs(fb) ? a : b;
    const fm = value(c, m);
    if (fm === 0) return m;
    if (fm < 0 === fa < 0) [a, fa] = [m, fm];
    else [b, fb] = [m, fm];
  }
};

/** Roots of `p` in `(0, hi)` given its sorted critical points there (monotone in between). */
const rootsBetween = (c: number[], critical: number[], hi: number): number[] => {
  const ends = [0, ...critical, hi];
  const out: number[] = [];
  for (let i = 0; i + 1 < ends.length; i++) {
    const a = ends[i] as number;
    const b = ends[i + 1] as number;
    const fa = value(c, a);
    const fb = value(c, b);
    if (fa === 0) {
      if (a > 0 && out.at(-1) !== a) out.push(a);
    } else if (fb !== 0 && fa < 0 !== fb < 0) out.push(bisect(c, a, b, fa, fb));
  }
  return out;
};

/**
 * Internal rate of return: the `r > −1` with `Σ CF_t / (1 + r)^t = 0`. When several rates
 * solve it (non-conventional flows), returns the one closest to 0, as numpy-financial
 * `irr` does; `NaN` when none does (including empty or all-zero flows). Every real root of
 * the polynomial in `x = 1/(1 + r)` is isolated exactly (between the roots of its
 * derivative, recursively), then bisected to full float64 precision; a root where NPV only
 * touches 0 without changing sign is found only if NPV evaluates to exactly 0 there.
 * Throws `RangeError` on a non-finite flow.
 *
 * @example
 * irr({ cashFlows: [-100, 39, 59, 55, 20] }); // 0.28095…
 */
export const irr = (input: {
  /** Cash flow per period, year 0 first (investment negative), finite. */
  cashFlows: ArrayLike<number>;
}): number => {
  const cf = Array.from(input.cashFlows);
  assertFinite("cashFlows", cf);
  // drop zero flows at both ends: leading ones only add the root x = 0 (r = ∞)
  const first = cf.findIndex((c) => c !== 0);
  if (first < 0) return Number.NaN;
  let last = cf.length - 1;
  while (cf[last] === 0) last--;
  const c = cf.slice(first, last + 1);
  const n = c.length - 1;
  if (value(c, 1) === 0) return 0;
  // Descartes: sign changes in the coefficients bound the number of positive roots
  let changes = 0;
  let sign = Math.sign(c[0] as number);
  for (const v of c) {
    if (v !== 0 && Math.sign(v) !== sign) [changes, sign] = [changes + 1, Math.sign(v)];
  }
  // Cauchy bound: every root has |x| < 1 + max|c_t / c_n|
  const lead = Math.abs(c[n] as number);
  const hi = Math.min(
    Number.MAX_VALUE,
    1 + Math.max(...c.slice(0, n).map((v) => Math.abs(v) / lead)),
  );
  let roots: number[] = [];
  if (changes === 1) {
    roots = rootsBetween(c, [], hi); // one sign change in the coefficients → one root (Descartes)
  } else if (changes > 1) {
    // derivatives p^(k), k = n−1 … 0, each rescaled to max |coef| = 1 (signs are all that
    // matter); the roots of p^(k+1) split (0, hi) into intervals where p^(k) is monotone
    const levels = [c];
    for (let k = 1; k < n; k++) {
      const d = (levels[k - 1] as number[]).slice(1).map((v, t) => v * (t + 1));
      const s = Math.max(...d.map(Math.abs));
      levels.push(d.map((v) => v / s));
    }
    for (let k = n - 1; k >= 0; k--) roots = rootsBetween(levels[k] as number[], roots, hi);
  }
  let best = Number.NaN;
  for (const x of roots) {
    const r = 1 / x - 1;
    if (!(Math.abs(r) >= Math.abs(best))) best = r;
  }
  return best;
};
