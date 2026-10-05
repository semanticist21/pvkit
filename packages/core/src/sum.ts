/**
 * Neumaier (improved Kahan) compensated summation.
 *
 * Use for every energy integral / long reduction — a naive `+=` over 10^5–10^6
 * timesteps drifts the lifetime-kWh number. See doc/architecture.md →
 * "Numerical strategy — float64, zero deps".
 */
export const compensatedSum = (values: ArrayLike<number>): number => {
  let sum = 0;
  let c = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i] as number;
    const t = sum + v;
    c += Math.abs(sum) >= Math.abs(v) ? sum - t + v : v - t + sum;
    sum = t;
  }
  return sum + c;
};
