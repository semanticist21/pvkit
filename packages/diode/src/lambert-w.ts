/**
 * Principal-branch Lambert W of `e^logX`: the `w > 0` with `w·e^w = e^logX`, i.e.
 * `w + ln w = logX`. Taking the argument as a logarithm keeps the I-V solver finite
 * where `x` itself overflows float64 (large `V / nNsVth`).
 *
 * Newton on `g(w) = w + ln w − logX`, step `w ← w(1 + logX − ln w)/(1 + w)`; `g` is concave
 * and increasing, so iterates from below converge monotonically and quadratically.
 */
export const lambertWExp = (logX: number): number => {
  if (Number.isNaN(logX)) return Number.NaN;
  if (logX === Number.POSITIVE_INFINITY) return Number.POSITIVE_INFINITY;
  // W(x) = x − x² + …: below e^−40 the x² term is under ε·x; also covers exp underflow → 0
  // (Newton from w = 0 would give 0·∞ = NaN).
  if (logX < -40) return Math.exp(logX);
  // Start below the root: W(x) ≈ x/(1+x) for small x, ln x − ln ln x asymptotically.
  let w = logX < 1 ? Math.exp(logX) / (1 + Math.exp(logX)) : Math.max(logX - Math.log(logX), 1e-3);
  for (let k = 0; k < 100; k++) {
    const next = (w * (1 + logX - Math.log(w))) / (1 + w);
    if (Math.abs(next - w) <= 4 * Number.EPSILON * next) return next;
    w = next;
  }
  return w;
};
