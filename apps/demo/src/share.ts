import type { EstimateInput } from "./estimate.ts";
import source from "./estimate.ts?raw";

/** The parts of an `<input type="number">` that bound its value (an HTMLInputElement fits). */
export interface Field {
  name: string;
  defaultValue: string;
  min: string;
  max: string;
}

/**
 * Field values from a query string: each param that is a finite number within its field's
 * min/max, otherwise the field's default. Unknown params are ignored.
 */
export const readQuery = (search: string, fields: readonly Field[]): Record<string, string> => {
  const q = new URLSearchParams(search);
  return Object.fromEntries(
    fields.map(({ name, defaultValue, min, max }) => {
      const raw = q.get(name)?.trim() ?? "";
      const n = Number(raw);
      const ok =
        raw !== "" &&
        Number.isFinite(n) &&
        (min === "" || n >= Number(min)) &&
        (max === "" || n <= Number(max));
      return [name, ok ? String(n) : defaultValue];
    }),
  );
};

// toPrecision(12) drops float noise such as 14.1 / 100 = 0.14100000000000001.
const num = (n: number) => String(Number(n.toPrecision(12)));

/** Standalone module that reproduces the demo's result: the demo's own estimate source + one call. */
export const codeFor = (input: EstimateInput): string => {
  const args = Object.entries(input)
    .map(([k, v]) => `  ${k}: ${num(v)},`)
    .join("\n");
  return `${source.trimEnd()}

// Clear-sky upper bound, not a yield forecast: real weather lowers it.
const result = estimate({
${args}
});
console.log(Math.round(result.annualKwh), "kWh/yr", result.monthlyKwh);
`;
};
