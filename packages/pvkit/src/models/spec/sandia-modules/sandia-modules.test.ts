import { expect, test } from "vitest";
import { checkAgainstPvlib, type Mapping } from "../testing.ts";
import { SANDIA_MODULES } from "./sandia-modules.ts";
import fixtures from "./sandia-modules-fixtures.json" with { type: "json" };

const MAPPING: Mapping = [
  ["vintage", "Vintage"],
  ["material", "Material"],
  ["area", "Area"],
  ["cellsInSeries", "Cells in Series"],
  ["parallelStrings", "Parallel Strings"],
  ["isco", "Isco"],
  ["voco", "Voco"],
  ["impo", "Impo"],
  ["vmpo", "Vmpo"],
  ["aisc", "Aisc"],
  ["aimp", "Aimp"],
  ["bvoco", "Bvoco"],
  ["mbvoc", "Mbvoc"],
  ["bvmpo", "Bvmpo"],
  ["mbvmp", "Mbvmp"],
  ["n", "N"],
  ["c0", "C0"],
  ["c1", "C1"],
  ["c2", "C2"],
  ["c3", "C3"],
  ["c4", "C4"],
  ["c5", "C5"],
  ["c6", "C6"],
  ["c7", "C7"],
  ["ixo", "IXO"],
  ["ixxo", "IXXO"],
  ["a0", "A0"],
  ["a1", "A1"],
  ["a2", "A2"],
  ["a3", "A3"],
  ["a4", "A4"],
  ["b0", "B0"],
  ["b1", "B1"],
  ["b2", "B2"],
  ["b3", "B3"],
  ["b4", "B4"],
  ["b5", "B5"],
  ["fd", "FD"],
  ["a", "a"],
  ["b", "b"],
  ["tempDelta", "dT"],
];

test("sampled rows match pvlib retrieve_sam", () => {
  checkAgainstPvlib(SANDIA_MODULES, fixtures, MAPPING);
});

test("every row is physically ordered", () => {
  for (const m of SANDIA_MODULES) {
    expect(m.voco > m.vmpo && m.isco > m.impo && m.vmpo > 0, m.name).toBe(true);
  }
});
