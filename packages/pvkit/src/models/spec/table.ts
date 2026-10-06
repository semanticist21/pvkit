/** Column-major-header table as the data JSON stores it: one field list, one array per row. */
export interface Table {
  fields: readonly string[];
  rows: readonly (readonly unknown[])[];
}

/** Expand a table into one object per row; `null` cells (blank in the source) are omitted. */
export function decodeTable<T>({ fields, rows }: Table): T[] {
  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    fields.forEach((field, i) => {
      if (row[i] !== null) out[field] = row[i];
    });
    return out as T;
  });
}
