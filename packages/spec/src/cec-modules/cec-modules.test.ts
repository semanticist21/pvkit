import { expect, test } from "vitest";
import { bit, checkAgainstPvlib, type Mapping, pct, yes } from "../../test/pvlib-fixtures.ts";
import { CEC_MODULES } from "./cec-modules.ts";
import fixtures from "./cec-modules-fixtures.json" with { type: "json" };

const MAPPING: Mapping = [
  ["manufacturer", "Manufacturer"],
  ["technology", "Technology"],
  ["bifacial", "Bifacial", bit],
  ["bipv", "BIPV", yes],
  ["stc", "STC"],
  ["ptc", "PTC"],
  ["area", "A_c"],
  ["length", "Length"],
  ["width", "Width"],
  ["cellsInSeries", "N_s"],
  ["isc", "I_sc_ref"],
  ["voc", "V_oc_ref"],
  ["imp", "I_mp_ref"],
  ["vmp", "V_mp_ref"],
  ["alphaSc", "alpha_sc"],
  ["betaOc", "beta_oc"],
  ["gammaPmp", "gamma_pmp", pct],
  ["noct", "T_NOCT"],
  ["aRef", "a_ref"],
  ["iLRef", "I_L_ref"],
  ["iORef", "I_o_ref"],
  ["rS", "R_s"],
  ["rShRef", "R_sh_ref"],
  ["adjust", "Adjust"],
];

test("sampled rows match pvlib retrieve_sam", () => {
  checkAgainstPvlib(CEC_MODULES, fixtures, MAPPING, 1e-14);
});

test("every row is physically ordered", () => {
  for (const m of CEC_MODULES) {
    expect(m.voc > m.vmp && m.vmp > 0, m.name).toBe(true);
    expect(m.betaOc < 0 && m.gammaPmp < 0, m.name).toBe(true);
  }
});

test("source quirks stay as published", () => {
  // alphaSc ≈ 46 % of isc per °C, a unit error in the source (cec-modules.md).
  expect(CEC_MODULES.filter((m) => m.alphaSc > 0.01 * m.isc)).toHaveLength(6);
});
