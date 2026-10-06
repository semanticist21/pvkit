/** Throws `RangeError` unless every element of `xs` is finite (the economics module's array-input rule). */
export const assertFinite = (name: string, xs: ArrayLike<number>): void => {
  for (let i = 0; i < xs.length; i++) {
    if (!Number.isFinite(xs[i])) throw new RangeError(`${name}[${i}] must be finite, got ${xs[i]}`);
  }
};
