import { CEC_INVERTERS } from "@pvkit/spec/cec-inverters";
import { CEC_MODULES } from "@pvkit/spec/cec-modules";
import { SANDIA_MODULES } from "@pvkit/spec/sandia-modules";
import { expect, test } from "vitest";
import { calcparamsCec } from "./calcparams-cec/calcparams-cec.ts";
import { inverterSandia } from "./inverter-sandia/inverter-sandia.ts";
import { sapm } from "./sapm/sapm.ts";
import { singleDiode } from "./single-diode/single-diode.ts";

// @pvkit/spec rows spread straight into diode inputs (compile-time check) and give sane STC
// numbers. A devDependency only — diode has no runtime dependencies.

test("CEC modules reproduce their STC Pmp through calcparamsCec → singleDiode", () => {
  // A few SAM fits (71 of 21 677 in the 2026 library) miss their own Imp·Vmp by > 2 % — a
  // property of the published coefficients, which pvlib reproduces identically.
  const off = CEC_MODULES.filter((m) => {
    const { pMp } = singleDiode(calcparamsCec({ ...m, effectiveIrradiance: 1000, tempCell: 25 }));
    return !(Math.abs(pMp / (m.imp * m.vmp) - 1) <= 0.02);
  });
  expect(off.length / CEC_MODULES.length).toBeLessThan(0.005);
});

test("Sandia module at reference conditions returns its Impo·Vmpo", () => {
  const m = SANDIA_MODULES[0];
  if (!m) throw new Error("empty library");
  const r = sapm({ ...m, effectiveIrradiance: 1000, tempCell: 25 });
  expect(r.pMp / (m.impo * m.vmpo)).toBeCloseTo(m.c0 + m.c1, 12);
});

test("CEC inverter row runs through inverterSandia and clips at paco", () => {
  const inv = CEC_INVERTERS[0];
  if (!inv) throw new Error("empty library");
  expect(inverterSandia({ ...inv, vdc: inv.vdco, pdc: 2 * inv.pdco })).toBe(inv.paco);
});
