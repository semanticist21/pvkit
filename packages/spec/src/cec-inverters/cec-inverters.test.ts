import { expect, test } from "vitest";
import { checkAgainstPvlib, type Mapping, yes } from "../../test/pvlib-fixtures.ts";
import { CEC_INVERTERS } from "./cec-inverters.ts";
import fixtures from "./cec-inverters-fixtures.json" with { type: "json" };

const MAPPING: Mapping = [
  ["vac", "Vac"],
  ["paco", "Paco"],
  ["pdco", "Pdco"],
  ["vdco", "Vdco"],
  ["pso", "Pso"],
  ["c0", "C0"],
  ["c1", "C1"],
  ["c2", "C2"],
  ["c3", "C3"],
  ["pnt", "Pnt"],
  ["vdcMax", "Vdcmax"],
  ["idcMax", "Idcmax"],
  ["mpptLow", "Mppt_low"],
  ["mpptHigh", "Mppt_high"],
  ["hybrid", "CEC_hybrid", yes],
];

test("sampled rows match pvlib retrieve_sam", () => {
  checkAgainstPvlib(CEC_INVERTERS, fixtures, MAPPING);
});

test("every row has an ordered DC window and pdco > paco", () => {
  for (const i of CEC_INVERTERS) {
    expect(i.vdcMax >= i.mpptHigh && i.mpptHigh >= i.mpptLow && i.mpptLow > 0, i.name).toBe(true);
    expect(i.pdco > i.paco && i.paco > 0, i.name).toBe(true);
  }
});
