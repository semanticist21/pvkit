// Consumer check: pack @pvkit/core, @pvkit/spec, @pvkit/io, @pvkit/chain and @pvkit/sizer, install the tarball into a throwaway project, then
// typecheck imports (skipLibCheck off) under moduleResolution bundler and node16 and run a
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
  for (const pkg of ["core", "spec", "io", "chain", "sizer"]) {
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
export const rec: NasaPowerRecord<"ghi"> | undefined = undefined;
export const io = [typeof parseNasaPower, typeof getPvgisTmy];
const inv: number = CEC_INVERTERS[0]?.vdcMax ?? 0;
export const mod: CecModule | undefined = undefined;
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
import { parsePvgisTmy } from "@pvkit/io/pvgis-tmy";
if (typeof parsePvgisTmy !== "function") throw new Error("io import broken");
const { modelChain } = await import("@pvkit/chain/model-chain");
if (!(modelChain({ timeMs: Date.UTC(2025, 5, 21, 3), latitude: 37.57, longitude: 126.98, surfaceTilt: 30,
  surfaceAzimuth: 180, pdc0: 5000, gammaPdc: -0.004, linkeTurbidity: 3 }).pac > 0)) throw new Error("chain broken");
const { stringSize } = await import("@pvkit/sizer/string-size");
if (stringSize({ vocMax: 50, vmpMin: 25, imp: 9, vdcMax: 600, mpptLow: 250, idcMax: 18 }).maxSeries !== 12) throw new Error("sizer broken");
if (SANDIA_MODULES.length !== 523 || !(SANDIA_MODULES[0].isco > 0)) throw new Error("spec data broken");
const r = spa({ timeMs: Date.UTC(2003, 9, 17, 19, 30, 30), latitude: 39.742476, longitude: -105.1786 });
if (!(r.zenith > 50 && r.zenith < 51) || typeof root.toDegrees !== "function") throw new Error("runtime import broken");
`);
  run("node", ["run.mjs"]);
  console.log("consumer check ok");
} finally {
  rmSync(dir, { recursive: true, force: true });
}
