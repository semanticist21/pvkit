/** Inputs for {@link interp}. */
export interface InterpInput {
  /** Angle of incidence between module normal and sun beam, degrees. Sign is ignored. */
  aoi: number;
  /** Angles at which the IAM is known, degrees, strictly increasing, ≥ 2 points. */
  thetaRef: ArrayLike<number>;
  /** IAM at each `thetaRef`, unitless, ≥ 0. */
  iamRef: ArrayLike<number>;
  /** Divide by the interpolated value at 0° so IAM(0) = 1. Default true. */
  normalize?: boolean;
}

/** Piecewise-linear through (xs, ys), extrapolating the end segments. */
const linear = (xs: ArrayLike<number>, ys: ArrayLike<number>, x: number) => {
  let i = 0;
  while (i < xs.length - 2 && x >= (xs[i + 1] as number)) i++;
  const x0 = xs[i] as number;
  const x1 = xs[i + 1] as number;
  const y0 = ys[i] as number;
  const y1 = ys[i + 1] as number;
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
};

/**
 * IAM by linear interpolation of reference (usually measured) values at |aoi|; outside
 * `thetaRef` the end segments are extrapolated and the result clamped to ≥ 0. With
 * `normalize`, divided by the (unclamped) interpolant at 0°. Linear only — pvlib's
 * `method='quadratic'|'cubic'` splines are not provided.
 *
 * @throws RangeError on < 2 points, length mismatch, non-increasing `thetaRef`, negative
 *   `iamRef`.
 * @example
 * interp({ aoi: 45, thetaRef: [0, 30, 60, 90], iamRef: [1, 0.99, 0.9, 0] }); // 0.945
 */
export const interp = ({ aoi, thetaRef, iamRef, normalize = true }: InterpInput): number => {
  const n = thetaRef.length;
  if (n < 2) throw new RangeError(`thetaRef needs ≥ 2 points, got ${n}`);
  if (iamRef.length !== n) {
    throw new RangeError(`iamRef length ${iamRef.length} ≠ thetaRef length ${n}`);
  }
  for (let i = 0; i < n; i++) {
    if (!((iamRef[i] as number) >= 0)) throw new RangeError(`iamRef[${i}] must be ≥ 0`);
    if (i > 0 && !((thetaRef[i] as number) > (thetaRef[i - 1] as number))) {
      throw new RangeError(`thetaRef must be strictly increasing at index ${i}`);
    }
  }
  const iam = Math.max(0, linear(thetaRef, iamRef, Math.abs(aoi)));
  return normalize ? iam / linear(thetaRef, iamRef, 0) : iam;
};
