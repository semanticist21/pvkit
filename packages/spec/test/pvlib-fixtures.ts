import { expect } from "vitest";

/** pvkit field ← SAM column; `to` converts pvlib's parsed cell into the pvkit value. */
export type Mapping = readonly [field: string, column: string, to?: (v: unknown) => unknown][];

export interface Fixtures {
  meta: { rows: number };
  cases: { index: number; name: string; pvlib: Record<string, unknown> }[];
}

export const yes = (v: unknown) => String(v).trim() === "Y";
export const bit = (v: unknown) => v === 1;
export const pct = (v: unknown) => (v as number) / 100;

/** Assert each sampled row equals pvlib's independent parse of the same SAM CSV. */
export function checkAgainstPvlib(
  records: readonly object[],
  fixtures: Fixtures,
  mapping: Mapping,
): void {
  expect(records.length).toBe(fixtures.meta.rows);
  for (const { index, name, pvlib } of fixtures.cases) {
    const record = records[index] as Record<string, unknown>;
    expect(record.name).toBe(name);
    for (const [field, column, to] of mapping) {
      const cell = pvlib[column];
      const want = cell === null ? undefined : to ? to(cell) : cell;
      const got = record[field];
      if (typeof want === "number" && typeof got === "number") {
        // Same decimal text parsed twice → exact, except the %→fraction division (1 ULP).
        expect(Math.abs(got - want), `${name} ${field}`).toBeLessThanOrEqual(
          Math.abs(want) * 1e-15,
        );
      } else {
        expect(got, `${name} ${field}`).toStrictEqual(want);
      }
    }
  }
}
