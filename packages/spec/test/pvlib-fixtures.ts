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

/**
 * Assert each sampled row equals pvlib's independent parse of the same SAM CSV, to `relTol`
 * relative (0 = exact; the library's `.md` "## Reference" justifies any slack).
 */
export function checkAgainstPvlib(
  records: readonly object[],
  fixtures: Fixtures,
  mapping: Mapping,
  relTol = 0,
): void {
  expect(records.length).toBe(fixtures.meta.rows);
  // The fixture's columns are the generator's mapping; a column it adds or renames must be
  // mapped here too, or it would ship unchecked.
  for (const { pvlib } of fixtures.cases) {
    expect(Object.keys(pvlib)).toStrictEqual(mapping.map(([, column]) => column));
  }
  for (const { index, name, pvlib } of fixtures.cases) {
    const record = records[index] as Record<string, unknown>;
    expect(record.name).toBe(name);
    for (const [field, column, to] of mapping) {
      const cell = pvlib[column];
      const want = cell === null ? undefined : to ? to(cell) : cell;
      const got = record[field];
      if (typeof want === "number" && typeof got === "number") {
        expect(Math.abs(got - want), `${name} ${field}`).toBeLessThanOrEqual(
          Math.abs(want) * relTol,
        );
      } else {
        expect(got, `${name} ${field}`).toStrictEqual(want);
      }
    }
  }
}
