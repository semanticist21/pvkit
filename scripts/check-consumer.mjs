// Consumer check: pack every packages/* workspace, install the tarballs into a throwaway project,
// then typecheck imports (skipLibCheck off) under moduleResolution bundler and node16 and run a
// plain-Node ESM import. Catches broken published .d.ts / exports that in-repo tests miss.
// Run after `pnpm build`: node scripts/check-consumer.mjs
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const tsc = join(root, "node_modules/.bin/tsc");
const dir = mkdtempSync(join(tmpdir(), "pvkit-consumer-"));
const run = (cmd, args, cwd = dir) => execFileSync(cmd, args, { cwd, stdio: "inherit" });

try {
  for (const d of readdirSync(join(root, "packages"), { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const pkg = d.name;
    run("pnpm", ["pack", "--pack-destination", dir], join(root, "packages", pkg));
  }
  const tgzs = readdirSync(dir).filter((f) => f.endsWith(".tgz"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "consumer", private: true, type: "module" }));
  run("pnpm", ["add", ...tgzs.map((f) => `./${f}`), "--ignore-workspace"]);
  const code = `import { type Degrees, radians, toDegrees } from "@pvkit/core";
import { spa } from "@pvkit/core/solarposition/spa";
import { perez, totalIrradiance } from "@pvkit/core/irradiance";
import { sapmCell, SAPM_TEMPERATURE_PARAMETERS } from "@pvkit/core/temperature/sapm";
import type { CecModule } from "@pvkit/spec";
import { CEC_INVERTERS } from "@pvkit/spec/cec-inverters";
import { type NasaPowerRecord, parseNasaPower } from "@pvkit/io/nasa-power";
import { getPvgisTmy } from "@pvkit/io/pvgis-tmy";
import { type ModelChainResult, modelChain } from "@pvkit/chain/model-chain";
export const chain: ModelChainResult = modelChain({ timeMs: 0, latitude: 0, longitude: 0,
  surfaceTilt: 0, surfaceAzimuth: 180, pdc0: 1, gammaPdc: 0, linkeTurbidity: 3 });
import { type RoofFit, roofFit } from "@pvkit/layout/roof-fit";
export const roof: RoofFit = roofFit({ roofWidth: 5, roofHeight: 3, moduleLength: 1.7, moduleWidth: 1.1 });
export const rec: NasaPowerRecord<"ghi"> | undefined = undefined;
export const io = [typeof parseNasaPower, typeof getPvgisTmy];
const inv: number = CEC_INVERTERS[0]?.vdcMax ?? 0;
export const mod: CecModule | undefined = undefined;
import { type StringSize, stringSize } from "@pvkit/sizer/string-size";
import { voltageAtTemperature } from "@pvkit/sizer/voltage-at-temperature";
import { necVoltageCorrection } from "@pvkit/sizer/nec-voltage-correction";
export const sizer: [StringSize | undefined, ...unknown[]] = [undefined, typeof stringSize,
  typeof voltageAtTemperature, typeof necVoltageCorrection];
import { npv } from "@pvkit/economics/npv";
import * as economics from "@pvkit/economics";
export const npv0: number = npv({ cashFlows: [-1, 1], discountRate: 0 }) + economics.irr.length;
import { type IvPoints, singleDiode } from "@pvkit/diode/single-diode";
import * as diode from "@pvkit/diode";
export const iv: IvPoints | undefined = undefined;
export const diodeFns = [typeof singleDiode, typeof diode.calcparamsCec];
const z: Degrees = spa({ timeMs: 0, latitude: 0, longitude: 0 }).zenith;
export const out = [z, toDegrees(radians(1)), typeof perez, typeof totalIrradiance, typeof sapmCell,
  SAPM_TEMPERATURE_PARAMETERS.openRackGlassGlass.a, inv];
`;
  writeFileSync(join(dir, "check.ts"), code);
  for (const [module, moduleResolution] of [["esnext", "bundler"], ["node16", "node16"]]) {
    run(tsc, ["--noEmit", "--strict", "--skipLibCheck", "false", "--module", module,
      "--moduleResolution", moduleResolution, "--target", "es2022", "check.ts"]);
  }
  writeFileSync(join(dir, "run.mjs"), `import { spa } from "@pvkit/core/solarposition/spa";
import * as root from "@pvkit/core";
import { SANDIA_MODULES } from "@pvkit/spec/sandia-modules";
import { CEC_MODULES } from "@pvkit/spec/cec-modules";
import { parsePvgisTmy } from "@pvkit/io/pvgis-tmy";
if (typeof parsePvgisTmy !== "function") throw new Error("io import broken");
const { modelChain } = await import("@pvkit/chain/model-chain");
if (!(modelChain({ timeMs: Date.UTC(2025, 5, 21, 3), latitude: 37.57, longitude: 126.98, surfaceTilt: 30,
  surfaceAzimuth: 180, pdc0: 5000, gammaPdc: -0.004, linkeTurbidity: 3 }).pac > 0)) throw new Error("chain broken");
const { stringSize } = await import("@pvkit/sizer/string-size");
if (stringSize({ vocMax: 50, vmpMin: 25, imp: 9, vdcMax: 600, mpptLow: 250, idcMax: 18 }).maxSeries !== 12) throw new Error("sizer broken");
const { minPitch } = await import("@pvkit/layout/min-pitch");
if (!(minPitch({ collectorWidth: 2, surfaceTilt: 30, surfaceAzimuth: 180, solarZenith: 60, solarAzimuth: 180 }) > 3)) throw new Error("layout broken");
for (const p of ["voltage-at-temperature", "nec-voltage-correction"]) {
  if (Object.values(await import(\`@pvkit/sizer/\${p}\`)).every((f) => typeof f !== "function")) throw new Error(\`sizer/\${p} broken\`);
}
const { npv } = await import("@pvkit/economics/npv");
if (Math.abs(npv({ cashFlows: [-40000, 5000, 8000, 12000, 30000], discountRate: 0.08 }) - 3065.22) > 0.01) throw new Error("economics broken");
if (typeof (await import("@pvkit/economics")).irr !== "function") throw new Error("economics root broken");
const { singleDiode } = await import("@pvkit/diode/single-diode");
const { calcparamsCec } = await import("@pvkit/diode");
if (!(singleDiode(calcparamsCec({ ...CEC_MODULES[0], effectiveIrradiance: 1000, tempCell: 25 })).pMp > 0)) throw new Error("diode broken");
if (!(CEC_MODULES.length > 0) || !(SANDIA_MODULES.length > 500) || !(SANDIA_MODULES[0].isco > 0)) throw new Error("spec data broken");
const r = spa({ timeMs: Date.UTC(2003, 9, 17, 19, 30, 30), latitude: 39.742476, longitude: -105.1786 });
if (!(r.zenith > 50 && r.zenith < 51) || typeof root.toDegrees !== "function") throw new Error("runtime import broken");
`);
  run("node", ["run.mjs"]);
  console.log("consumer check ok");
} finally {
  rmSync(dir, { recursive: true, force: true });
}
