import { compensatedSum } from "../sum.ts";

const at = (price: number | ArrayLike<number>, i: number): number =>
  typeof price === "number" ? price : (price[i] as number);

/**
 * Bill savings from PV with per-interval netting (net billing): in each interval the
 * production first covers the load (self-consumption, valued at the import price) and the
 * surplus is exported (valued at the export price).
 * `selfConsumption = Σ min(P, L)`, `export = Σ max(P − L, 0)`, `import = Σ max(L − P, 0)`,
 * `savings = Σ min(P, L)·p_import + Σ max(P − L, 0)·p_export`.
 *
 * @example
 * billSavings({ production: [3, 1], load: [1, 2], importPrice: 0.3, exportPrice: 0.1 });
 * // { selfConsumption: 2, export: 2, import: 1, avoidedCost: 0.6, exportRevenue: 0.2, savings: 0.8 }
 */
export const billSavings = (input: {
  /** PV energy per interval, kWh, ≥ 0. */
  production: ArrayLike<number>;
  /** Site consumption per interval, kWh, ≥ 0; same length as `production`. */
  load: ArrayLike<number>;
  /** Retail price per kWh bought — one flat value or one per interval (time-of-use). */
  importPrice: number | ArrayLike<number>;
  /** Price per kWh exported — one flat value or one per interval (0 = no export credit). */
  exportPrice: number | ArrayLike<number>;
}): {
  /** PV energy used on site, kWh. */
  selfConsumption: number;
  /** PV energy sent to the grid, kWh. */
  export: number;
  /** Energy still bought with PV, kWh. */
  import: number;
  /** Self-consumption × import price. */
  avoidedCost: number;
  /** Export × export price. */
  exportRevenue: number;
  /** `avoidedCost + exportRevenue` — the bill reduction versus no PV. */
  savings: number;
} => {
  const { production, load, importPrice, exportPrice } = input;
  const n = production.length;
  for (const [name, a] of [
    ["load", load],
    ["importPrice", importPrice],
    ["exportPrice", exportPrice],
  ] as const) {
    if (typeof a !== "number" && a.length !== n) {
      throw new RangeError(`${name} has ${a.length} values, production has ${n}`);
    }
  }
  const self = new Float64Array(n);
  const exp = new Float64Array(n);
  const imp = new Float64Array(n);
  const avoided = new Float64Array(n);
  const revenue = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const p = production[i] as number;
    const l = load[i] as number;
    if (!(p >= 0 && l >= 0))
      throw new RangeError(`production/load must be ≥ 0, got ${p}/${l} at ${i}`);
    const s = Math.min(p, l);
    self[i] = s;
    exp[i] = p - s;
    imp[i] = l - s;
    avoided[i] = s * at(importPrice, i);
    revenue[i] = (p - s) * at(exportPrice, i);
  }
  const avoidedCost = compensatedSum(avoided);
  const exportRevenue = compensatedSum(revenue);
  return {
    selfConsumption: compensatedSum(self),
    export: compensatedSum(exp),
    import: compensatedSum(imp),
    avoidedCost,
    exportRevenue,
    savings: avoidedCost + exportRevenue,
  };
};
