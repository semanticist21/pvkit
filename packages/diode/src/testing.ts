// Test-only helpers (excluded from the build in tsdown.config.ts).

/** Fixture JSON stores NaN as null and ±Infinity as strings; restore them recursively. */
// biome-ignore lint/suspicious/noExplicitAny: fixture JSON is untyped by design
export const decode = (x: unknown): any => {
  if (x === null) return Number.NaN;
  if (x === "Infinity") return Number.POSITIVE_INFINITY;
  if (x === "-Infinity") return Number.NEGATIVE_INFINITY;
  if (Array.isArray(x)) return x.map(decode);
  if (typeof x === "object")
    return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, decode(v)]));
  return x;
};

/** `|got − want| ≤ atol + rtol·|want|`, NaN only matching NaN, ±Infinity matching exactly. */
export const close = (got: number, want: number, rtol: number, atol = 0): boolean =>
  Number.isNaN(want)
    ? Number.isNaN(got)
    : got === want || Math.abs(got - want) <= atol + rtol * Math.abs(want);

/** One `[name, case]` row per fixture case, decoded, for `test.each`. */
export const rows = (fixtures: { cases: unknown[] }) =>
  fixtures.cases.map((c, i) => [i, decode(c)] as const);
