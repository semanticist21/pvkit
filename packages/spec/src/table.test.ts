import { expect, test } from "vitest";
import { decodeTable } from "./table.ts";

test("decodes rows by field and omits null cells", () => {
  const rows = decodeTable<{ a: number; b?: string }>({
    fields: ["a", "b"],
    rows: [
      [1, "x"],
      [2, null],
    ],
  });
  expect(rows).toEqual([{ a: 1, b: "x" }, { a: 2 }]);
  expect("b" in (rows[1] ?? {})).toBe(false);
});
